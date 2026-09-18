# Distributed Execution

RayOrch uses Ray rather than replacing it:

```text
Ray cluster
  ├─ node placement and resource accounting
  ├─ actor lifecycle and RPC transport
  └─ runtime environments

RayOrch
  ├─ compile Pipeline dependencies
  ├─ track cardinality and lineage
  ├─ decide which Grain is READY
  ├─ form per-Call execution microbatches
  └─ reconstruct results and reports
```

Connect to an existing cluster with `address="auto"` in `rayorch.run()` or `Executor`. Ray places each persistent actor according to the options declared on its Call.

## Multi-node contract

For a workload to run correctly across nodes:

1. every eligible environment can import compatible RayOrch and workload code;
2. model, data, output, and artifact paths are visible consistently, normally through shared storage;
3. each stage declares honest CPU, GPU, memory, and custom-resource needs;
4. network services and credentials needed by UDFs are reachable from their actor nodes;
5. the Ray head and worker nodes use compatible Ray and Python versions.

RayOrch does not copy large datasets or model weights as part of graph execution.
