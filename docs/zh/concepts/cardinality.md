# 基数与血缘

基数描述逻辑数据有多少条、它们与父级输入是什么关系。RayOrch 通过 `rayorch.F` 显式表达这些关系。

## `expand`：一个父项展开成多个子项

UDF 为每个输入行返回一个子项列表，`expand` 从父级 Domain 进入子级 Domain。

```python
page_groups = self.render(pdf_paths)  # 每个 PDF 对应一个页面列表
pages = ro.F.expand(page_groups)      # 每一页成为一个 Grain
text = self.ocr(pages)
```

子项会保留父项身份和原始顺序。

## `reduce`：有序子项回到父级

```python
text_groups = ro.F.reduce(text)
documents = self.assemble(text_groups)
```

每个归约值都是某个父项的有序列表。零子项也是合法情况，会归约为空列表。多个子域 Port 一起返回时使用 `reduce_aligned()`；过滤后的成员决定归约范围时使用 `members=`。

## `filter`：只保留选中的成员

```python
mask = self.is_valid(pages)
valid_pages = ro.F.filter(pages, mask)
```

过滤只改变成员关系，不创建 UDF Actor。被过滤的数据会向下传播 DROPPED 状态，而不会调用下游 UDF。

## `broadcast`：把父级数据投影到子域

```python
pages = ro.F.expand(self.render(pdfs))
metadata = self.metadata(pdfs)
metadata_per_page = ro.F.broadcast(metadata, like=pages)
page_results = self.process(pages, metadata_per_page)
```

`like` 指定目标子级 Domain。每个匹配后代都能拿到对应父级值，同时保留明确血缘。

## 为什么这些必须是框架操作

如果展开和聚合藏在任意 Python 代码中，调度器无法知道哪个子项已经就绪、它属于哪个父项、一个有序组何时完整。显式结构操作使 RayOrch 能按 Grain 提前释放下游、确定性重建嵌套结果、正确处理空组，并且无需为结构转换创建 Actor。
