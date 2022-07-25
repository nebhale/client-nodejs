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

import {isValidSecretKey} from './secret'

import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'

/**
 * The key for the provider of a binding.
 */
export const PROVIDER: string = 'provider'

/**
 * The key for the type of a binding.
 */
export const TYPE: string = 'type'

/**
 * A representation of a binding as defined by the
 * <a href="https://github.com/k8s-service-bindings/spec#workload-projection">Kubernetes Service Binding Specification</a>.
 */
export interface Binding {

    /**
     * Returns the contents of a binding entry in its raw {@link Buffer} form.
     *
     * @param key the key of the entry to retrieve
     * @return the contents of a binding entry if it exists, otherwise `undefined`
     */
    getAsBytes(key: string): Promise<Buffer | undefined>

    /**
     * Returns the name of the binding.
     *
     * @return the name of the binding
     */
    getName(): string
}

/**
 * Returns the contents of a binding entry as a UTF-8 decoded {@link string}.  Any whitespace is trimmed.
 *
 * @param binding the binding to read from
 * @param key the key of the entry to retrieve
 * @return the contents of a binding entry as a UTF-8 decoded {@link string} if it exists, otherwise `undefined`
 */
export async function get(binding: Binding, key: string): Promise<string | undefined> {
    const b = await binding.getAsBytes(key)
    return b?.toString('utf8').trim()
}

/**
 * Returns the value of the {@link PROVIDER} key.
 *
 * @param binding the binding to read from
 * @return the value of the {@link PROVIDER} key if it exists, otherwise `undefined`
 */
export async function getProvider(binding: Binding): Promise<string | undefined> {
    return get(binding, PROVIDER)
}

/**
 * Returns the value of the {@link TYPE} key.
 *
 * @param binding the binding to read from
 * @return the value of the {@link TYPE} key
 */
export async function getType(binding: Binding): Promise<string> {
    const t = await get(binding, TYPE);
    if (t == undefined) {
        throw new Error('binding does not contain a type')
    }
    return t
}

/**
 * An implementation of {@link Binding} that caches values once they've been retrieved.
 */
export class CacheBinding implements Binding {

    private delegate: Binding

    private cache: Map<String, Buffer>

    /**
     * Creates a new instance.
     *
     * @param delegate the {@link Binding} used to retrieve original values
     */
    constructor(delegate: Binding) {
        this.delegate = delegate
        this.cache = new Map<String, Buffer>()
    }

    async getAsBytes(key: string): Promise<Buffer | undefined> {
        if (this.cache.has(key)) {
            return this.cache.get(key)
        }

        const v = await this.delegate.getAsBytes(key)
        if (v != undefined) {
            this.cache.set(key, v)
        }
        return v
    }

    getName(): string {
        return this.delegate.getName()
    }

}

/**
 * An implementation of {@link Binding} that reads files from a
 * <a href="https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets">volume mounted</a> Kubernetes
 * Secret.
 */
export class ConfigTreeBinding implements Binding {

    private root: string

    /**
     * Creates a new `ConfigTreeBinding` instance.
     *
     * @param root the root of the volume mounted Kubernetes Secret
     */
    constructor(root: string) {
        this.root = root
    }

    async getAsBytes(key: string): Promise<Buffer | undefined> {
        if (!isValidSecretKey(key)) {
            return undefined
        }

        const p = path.join(this.root, key)
        try {
            const s = await stat(p)
            return s.isFile() ? readFile(p) : undefined
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                return undefined
            }

            throw e
        }
    }

    getName(): string {
        return path.basename(this.root)
    }

}

/**
 * An implementation of {@link Binding} that returns values from a {@link Map}.
 */
export class MapBinding implements Binding {

    private name: string

    private content: Map<string, Buffer>

    /**
     * Creates a new `MapBinding` instance.
     *
     * @param name    the name of the binding
     * @param content the content of the binding
     */
    constructor(name: string, content: Map<string, Buffer>) {
        this.name = name
        this.content = content
    }

    async getAsBytes(key: string): Promise<Buffer | undefined> {
        if (!isValidSecretKey(key)) {
            return undefined
        }

        return this.content.get(key)
    }

    getName(): string {
        return this.name
    }

}

const readFile = util.promisify(fs.readFile)
const stat = util.promisify(fs.stat)
