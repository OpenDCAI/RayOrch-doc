# Cardinality and Lineage

Cardinality describes how many logical items exist and how they relate to their parents. RayOrch makes those relationships explicit with `rayorch.F`.

## `expand`: one parent becomes many children

The UDF returns one list of children for each input row. `expand` moves from the parent domain into the child domain.

```python
page_groups = self.render(pdf_paths)  # one list per PDF
pages = ro.F.expand(page_groups)      # one Grain per page
text = self.ocr(pages)
```

Children keep their parent identity and ordinal.

## `reduce`: ordered children return to their parent

```python
text_groups = ro.F.reduce(text)
documents = self.assemble(text_groups)
```

Each reduced value is an ordered list for one parent. Empty child groups are valid and reduce to an empty list. Use `reduce_aligned()` when several child-domain Ports must return together, and `members=` when membership should be defined by a filtered Port.

## `filter`: preserve only selected members

```python
mask = self.is_valid(pages)
valid_pages = ro.F.filter(pages, mask)
```

Filtering changes membership without creating a UDF actor. A dropped input propagates as dropped instead of invoking downstream UDFs.

## `broadcast`: project parent data into a child domain

```python
pages = ro.F.expand(self.render(pdfs))
metadata = self.metadata(pdfs)
metadata_per_page = ro.F.broadcast(metadata, like=pages)
page_results = self.process(pages, metadata_per_page)
```

The `like` Port identifies the descendant domain. The parent value is made available to each matching descendant while lineage remains explicit.

## Why these are framework operations

If fan-out and fan-in live only inside arbitrary Python, the scheduler cannot know which child is ready, which parent owns it, or when an ordered group is complete. Explicit structural operations let RayOrch release downstream work at Grain granularity, reconstruct nested results deterministically, handle empty groups, and propagate filtering or failures without structural actors.
