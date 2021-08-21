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

import {Binding, CacheBinding, ConfigTreeBinding, getProvider, getType} from './binding'

import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'

export const SERVICE_BINDING_ROOT: string = 'SERVICE_BINDING_ROOT'

/**
 * Wraps each {@link Binding} in a {@link CacheBinding}.
 *
 * @param bindings the {@link Binding}s to wrap
 * @return the wrapped {@link Binding}s
 */
export function cached(bindings: Binding[]): Binding[] {
    return bindings
        .map((v) => new CacheBinding(v))
}

/**
 * Creates a new collection of {@link Binding}s, using the specified `root`.  If the directory does not exist, an
 * empty collection is returned.
 *
 * @param root the root to populate the `Binding`s from
 */
export async function from(root: string): Promise<Binding[]> {
    let s
    try {
        s = await stat(root)
    } catch (e) {
        if (e.code === 'ENOENT') {
            return []
        }

        throw e
    }

    if (!s.isDirectory()) {
        return []
    }

    const c = await readdir(root);
    const d = await Promise.all(c.map((c) => {
        const p = path.join(root, c)
        return stat(p).then((s) => ({path: p, stats: s}))
    }))

    return d.reduce((b, c) => {
        if (c.stats.isDirectory()) {
            b.push(new ConfigTreeBinding(c.path))
        }

        return b
    }, new Array<Binding>())
}

/**
 * Creates a new collection of {@link Binding}s using the `$SERVICE_BINDING_ROOT` environment variable to determine the
 * file system root.  If the `$SERVICE_BINDING_ROOT` environment variables is not set, an empty collection is returned.
 * If the directory does not exist, an empty collection is returned.
 */
export async function fromServiceBindingRoot(): Promise<Binding[]> {
    const path = process.env[SERVICE_BINDING_ROOT]
    return path == undefined ? [] : from(path)
}

/**
 * Returns a {@link Binding} with a given name. Comparison is case-insensitive.
 *
 * @param bindings the `Binding`s to find in
 * @param name the name of the `Binding` to find
 * @return the `Binding` with a given name if it exists, `undefined` otherwise
 */
export function find(bindings: Binding[], name: string): Binding | undefined {
    for (const b of bindings) {
        if (equalsIgnoreCase(b.getName(), name)) {
            return b
        }
    }

    return undefined
}

/**
 * Return zero or more {@link Binding}s with a given type and provider.  If `type` or `provider` are `undefined, the
 * result is not filtered on that argument.  Comparisons are case-insensitive.
 *
 * @param bindings the `Bindings`s to filter
 * @param type     the type of `Binding` to find
 * @param provider the provider of `Binding` to find
 * @return the collection of ``Binding`s with a given type and provider
 */
export async function filter(bindings: Binding[], type?: string, provider?: string): Promise<Binding[]> {
    const d = await Promise.all(bindings.map(async (b) => {
        let m = true

        if (type != undefined) {
            const t = await getType(b)
            m = m && equalsIgnoreCase(t, type)
        }

        if (provider != undefined) {
            const p = await getProvider(b)
            m = m && p != undefined && equalsIgnoreCase(p, provider)
        }

        return {binding: b, match: m}
    }))

    return d.reduce((b, c) => {
        if (c.match) {
            b.push(c.binding)
        }

        return b
    },
    new Array<Binding>())
}

function equalsIgnoreCase(a: string, b: string): boolean {
    return a.localeCompare(b, undefined, {sensitivity: 'accent'}) === 0
}

const readdir = util.promisify(fs.readdir)
const stat = util.promisify(fs.stat)
