# Quickstart—Fan-out and Ordered Reduction

Many AI Pipelines are not one-input-to-one-output. A document contains many pages, a video contains many frames, and different inputs can produce different numbers of children.

This chapter builds the following Pipeline:

```text
Document ──► [Page, Page, ...] ──► ProcessPage ──► Document Result
                    expand                         reduce
```

We will use two documents with different page counts. RayOrch can batch pages from both documents in one processing stage, remember which document owns each page, and reduce them in the original order.

## 1. Complete example

Create `fan_out_and_reduce.py`:

```python
import rayorch as ro


class SplitPages:
    def run(self, documents):
        # Return one page list per document: list[list[str]].
        return [
            [f"{document['name']}:page-{page}" for page in range(document["pages"])]
            for document in documents
        ]


class ProcessPage:
    def run(self, pages):
        # Pages may come from different documents. RayOrch retains parentage.
        return [page.upper() for page in pages]


class AssembleDocument:
    def run(self, page_groups):
        # After reduce, each item is an ordered page list for one document.
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

## 2. Run it

```bash
python fan_out_and_reduce.py
```

The final output should be:

```text
['GUIDE:PAGE-0 | GUIDE:PAGE-1', 'PAPER:PAGE-0 | PAPER:PAGE-1 | PAPER:PAGE-2']
```

## 3. What `expand` does

`SplitPages.run()` returns one page list for each document:

```text
[
  [guide:page-0, guide:page-1],
  [paper:page-0, paper:page-1, paper:page-2],
]
```

At this point, `page_groups` still contains one logical value per document. Calling:

```python
pages = ro.F.expand(page_groups)
```

creates an explicit page level. `ProcessPage` now sees independent pages, so ready pages from different documents may share an execution batch:

```text
batch 0: guide/page-0, guide/page-1, paper/page-0
batch 1: paper/page-1, paper/page-2
```

Actual batches depend on completion timing and actor availability. RayOrch always retains each page's parent document and original position.

## 4. What `reduce` does

```python
ordered_page_groups = ro.F.reduce(processed_pages)
```

`reduce` moves back one level and groups processed pages by parent in their original order:

```text
[
  [GUIDE:PAGE-0, GUIDE:PAGE-1],
  [PAPER:PAGE-0, PAPER:PAGE-1, PAPER:PAGE-2],
]
```

It does not create an “aggregation actor” on the driver. `reduce` describes a structural relationship; `AssembleDocument.run()` still performs the business-specific assembly.

## 5. Why not hide everything in one UDF?

You can put all logic in one large UDF, but then:

- pages cannot independently enter downstream stages;
- pages from different documents are difficult to batch safely;
- the GPU page model cannot have its own replicas and resources;
- one completed document cannot easily move to assembly early;
- failures, execution metrics, and Benchmark stages become opaque.

`F.expand` and `F.reduce` make cardinality changes and parent-child relationships explicit instead of hiding them in business code.

## 6. Replace the tutorial with a real workload

Usually only the three UDFs need to change:

| Tutorial UDF | Real workload examples |
| --- | --- |
| `SplitPages` | PDF rendering, video decoding, detection-box generation |
| `ProcessPage` | OCR, a vision model, segmentation, embeddings |
| `AssembleDocument` | document reconstruction, video summary, result persistence |

The `expand → process → reduce` Pipeline structure can remain unchanged.

## Summary

- a UDF returning `list[list[T]]` produces one child group per parent input;
- `F.expand()` turns children into independently schedulable data;
- children can batch across parents without losing lineage;
- `F.reduce()` reconstructs groups by parent and original order.

Next, run the same kind of Pipeline on a [multi-node, multi-GPU Ray cluster](multi-node.md).
