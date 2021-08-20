# client-nodejs

[![Tests](https://github.com/nebhale/client-nodejs/workflows/Tests/badge.svg?branch=main)](https://github.com/nebhale/client-nodejs/actions/workflows/tests.yaml)
[![codecov](https://codecov.io/gh/nebhale/client-nodejs/branch/main/graph/badge.svg)](https://codecov.io/gh/nebhale/client-nodejs)

`client-nodejs` is a library to access [Service Binding Specification for Kubernetes](https://k8s-service-bindings.github.io/spec/) conformant Service Binding [Workload Projections](https://k8s-service-bindings.github.io/spec/#workload-projection).

## Example

```ts
import * as Bindings from 'bindings'
import { Pool } from 'pg'

let conn = Bindings.fromServiceBindingRoot()
    .then((b) => Bindings.filter(b, 'postgresql'))
    .then((b) => {
        if (b == undefined || b.length != 1) {
            Promise.reject(`Incorrect number of PostgreSQL drivers: ${b == undefined ? "0" : b.length}`)
        }

        return Bindings.get(b[0], 'url')
    })
    .then((u) => {
        if (u == undefined) {
            Promise.reject('No URL in binding')
        }

        return new Pool({
            connectionString: u
        })
    })

// ...
```

## License

Apache License v2.0: see [LICENSE](./LICENSE) for details.
