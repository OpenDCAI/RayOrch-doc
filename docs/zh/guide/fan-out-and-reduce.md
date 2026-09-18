# 快速上手—一对多与有序聚合

很多 AI Pipeline 不是简单的“一条输入变成一条输出”。例如一个文档包含多页、一个视频包含多帧，而且每个输入展开出的数量并不相同。

本章构建下面这条流水线：

```text
Document ──► [Page, Page, ...] ──► ProcessPage ──► Document Result
                    expand                         reduce
```

我们会输入两篇页数不同的文档。RayOrch 可以把所有页面交给同一个页面处理阶段合批，同时仍然记住页面属于哪篇文档，最后按原顺序聚合。

## 1. 完整代码

新建 `fan_out_and_reduce.py`：

```python
import rayorch as ro


class SplitPages:
    def run(self, documents):
        # 每篇文档返回一个页面列表，所以整体是 list[list[str]]。
        return [
            [f"{document['name']}:page-{page}" for page in range(document["pages"])]
            for document in documents
        ]


class ProcessPage:
    def run(self, pages):
        # pages 可以来自不同文档，但每一项的父级关系由 RayOrch 保存。
        return [page.upper() for page in pages]


class AssembleDocument:
    def run(self, page_groups):
        # reduce 后，每一项重新变成同一篇文档的有序页面列表。
        return [" | ".join(pages) for pages in page_groups]


class DocumentPipeline(ro.Pipeline):
    def __init__(self):
        self.split = ro.RayModule(SplitPages).ray_options(
            replicas=1,
            batch_size=2,
            num_cpus=1,
        )
        self.process = ro.RayModule(ProcessPage).ray_options(
            replicas=2,
            batch_size=3,
            num_cpus=1,
        )
        self.assemble = ro.RayModule(AssembleDocument).ray_options(
            replicas=1,
            batch_size=2,
            num_cpus=1,
        )

    def forward(self, documents):
        page_groups = self.split(documents)
        pages = ro.F.expand(page_groups)
        processed_pages = self.process(pages)
        ordered_page_groups = ro.F.reduce(processed_pages)
        return self.assemble(ordered_page_groups)


if __name__ == "__main__":
    inputs = [
        {"name": "guide", "pages": 2},
        {"name": "paper", "pages": 3},
    ]
    result = ro.run(DocumentPipeline(), inputs)
    print(result.outputs)
```

## 2. 运行

```bash
python fan_out_and_reduce.py
```

最后应输出：

```text
['GUIDE:PAGE-0 | GUIDE:PAGE-1', 'PAPER:PAGE-0 | PAPER:PAGE-1 | PAPER:PAGE-2']
```

## 3. `expand` 做了什么

`SplitPages.run()` 对每篇文档返回一个页面列表：

```text
[
  [guide:page-0, guide:page-1],
  [paper:page-0, paper:page-1, paper:page-2],
]
```

此时 `page_groups` 仍然是一篇文档对应一个值。调用：

```python
pages = ro.F.expand(page_groups)
```

会显式创建页面这一层数据。之后 `ProcessPage` 看到的是独立页面，因此不同文档的就绪页面可以进入同一个 execution batch：

```text
batch 0: guide/page-0, guide/page-1, paper/page-0
batch 1: paper/page-1, paper/page-2
```

实际 batch 由完成时间和可用 Actor 决定，但 RayOrch 会始终保留每个页面的父文档和原始位置。

## 4. `reduce` 做了什么

```python
ordered_page_groups = ro.F.reduce(processed_pages)
```

`reduce` 回到上一层，把处理后的页面按父文档重新组织成有序列表：

```text
[
  [GUIDE:PAGE-0, GUIDE:PAGE-1],
  [PAPER:PAGE-0, PAPER:PAGE-1, PAPER:PAGE-2],
]
```

它不是在 Driver 上调用一个“聚合 Actor”。`reduce` 描述的是结构关系；真正的业务组装仍然由 `AssembleDocument.run()` 完成。

## 5. 为什么不直接在 UDF 中展开和聚合

当然可以把所有逻辑都写进一个大 UDF，但这样会失去几个重要能力：

- 页面无法独立进入下游阶段；
- 不同文档的页面难以安全合批；
- GPU 页面模型无法配置独立副本和资源；
- 某篇文档先完成时，也很难提前进入组装阶段；
- 错误定位、执行指标和 Benchmark 拆分都会变得模糊。

`F.expand` 和 `F.reduce` 的作用，就是把“数量变化和父子关系”从业务代码中明确表达出来。

## 6. 把例子替换成真实负载

通常只需要替换三个 UDF：

| 教程 UDF | 真实负载示例 |
| --- | --- |
| `SplitPages` | PDF 渲染、视频解码、检测框生成 |
| `ProcessPage` | OCR、视觉模型、分割模型、Embedding |
| `AssembleDocument` | 文档重建、视频摘要、结果落盘 |

Pipeline 中的 `expand → process → reduce` 结构可以保持不变。

## 本章小结

- UDF 返回 `list[list[T]]`，表示每个父输入产生一组子项；
- `F.expand()` 让子项成为可独立调度的数据；
- 子项可以跨父输入合批，但血缘不会丢失；
- `F.reduce()` 按父级和原始顺序重新得到分组。

下一步可以把相同 Pipeline 放到[多机多卡 Ray 集群](multi-node.md)上运行。
