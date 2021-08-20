/*
 * Copyright 2021 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Bindings from '../'

import { Pool } from 'pg'

// @ts-ignore
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
