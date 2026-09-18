# Experiment Reproduction

This page defines the reproducibility contract before final paper commands and result tables are published.

## What a reproducible run records

A Benchmark configuration should include dataset/input path and input limit, model paths and versions, replica/GPU count per stage, model batch size, source input batching, runtime environments, and software/hardware versions.

RayOrch writes normalized configuration and standard execution metrics to each Benchmark artifact directory. Keep full Ray cluster configuration and external monitoring data beside those artifacts.

## Recommended procedure

1. Check out the exact RayOrch revision used by the experiment.
2. Prepare documented environments on every eligible node.
3. Verify shared input, model, output, and artifact paths.
4. Run a dependency-free topology Benchmark as a cluster smoke test.
5. Run a small real-model sample and validate outputs.
6. Run the full configuration with a preserved artifact directory.
7. Archive `config.json`, `summary.json`, `gpu_samples.jsonl`, Ray logs, and cluster metadata.

## Current status

The repository contains runnable workload definitions and standard reports. Final paper-specific datasets, exact command matrices, expected result ranges, and citation metadata are not yet declared here. They must be added from the finalized artifact rather than reconstructed from memory.
