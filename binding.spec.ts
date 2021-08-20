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


import {Binding, CacheBinding, ConfigTreeBinding, get, getProvider, getType, MapBinding} from './binding'

import {expect} from 'chai'
import 'mocha'

describe('binding', () => {

    it('should return string value', () => {
        let b = new MapBinding('test-name', new Map<string, Buffer>([
            ['test-secret-key', Buffer.from('test-secret-value\n', 'utf8')]
        ]))

        return get(b, 'test-secret-key')
            .then((v) => expect(v).to.equal('test-secret-value'))
    })

    describe('getProvider', () => {

        it('should return undefined if provider is not specified', () => {
            let b = new MapBinding('test-name', new Map<string, Buffer>())

            return getProvider(b)
                .then((v) => expect(v).to.be.undefined)
        })

        it('should return provider', () => {
            let b = new MapBinding('test-name', new Map<string, Buffer>([
                ['provider', Buffer.from('test-provider-1', 'utf8')]
            ]))

            return getProvider(b)
                .then((v) => expect(v).to.equal('test-provider-1'))
        })
    })

    describe('getType', () => {

        it('should throw error if type is not specified', () => {
            let b = new MapBinding('test-name', new Map<string, Buffer>())

            return getType(b)
                .catch((e) => expect(e.message).to.equal('binding does not contain a type'))
        })

        it('should return provider', () => {
            let b = new MapBinding('test-name', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-1', 'utf8')]
            ]))

            return getType(b)
                .then((v) => expect(v).to.equal('test-type-1'))
        })
    })

    describe('CacheBinding', () => {

        describe('getsBytes', () => {

            it('should retrieve uncached value', () => {
                let s = new StubBinding()
                let b = new CacheBinding(s)

                return b.getAsBytes("test-key")
                    .then((v) => {
                        expect(v).to.not.be.empty
                        expect(s.getAsBytesCount).to.equal(1)
                    })
            })

            it('should not cache unknown keys', () => {
                let s = new StubBinding()
                let b = new CacheBinding(s)

                return b.getAsBytes("test-unknown-key")
                    .then((v) => {
                        expect(v).to.be.undefined
                        return b.getAsBytes("test-unknown-key")
                    })
                    .then((v) => {
                        expect(v).to.be.undefined
                        expect(s.getAsBytesCount).to.equal(2)
                    })
            })

            it('should return cached value', () => {
                let s = new StubBinding()
                let b = new CacheBinding(s)

                return b.getAsBytes("test-key")
                    .then((v) => {
                        expect(v).to.not.be.empty
                        return b.getAsBytes("test-key")
                    })
                    .then((v) => {
                        expect(v).to.not.be.empty
                        expect(s.getAsBytesCount).to.equal(1)
                    })
            })
        })

        it('should always retrieve name', () => {
            let s = new StubBinding()
            let b = new CacheBinding(s)

            expect(b.getName()).to.not.be.empty
            expect(b.getName()).to.not.be.empty
            expect(s.getNameCount).to.equal(2)
        })
    })

    describe('ConfigTreeBinding', () => {

        describe('getAsBytes', () => {

            it('should return undefined for a missing key', () => {
                let b = new ConfigTreeBinding('testdata/test-k8s')

                return b.getAsBytes('test-missing-key')
                    .then((v) => expect(v).to.be.undefined)
            })

            it('should return undefined for a directory', () => {
                let b = new ConfigTreeBinding('testdata/test-k8s')

                return b.getAsBytes('.hidden-data')
                    .then((v) => expect(v).to.be.undefined)
            })

            it('should return undefined for a invalid key', () => {
                let b = new ConfigTreeBinding('testdata/test-k8s')

                return b.getAsBytes('test^invalid^key')
                    .then((v) => expect(v).to.be.undefined)
            })

            it('should return buffer', () => {
                let b = new ConfigTreeBinding('testdata/test-k8s')

                return b.getAsBytes('test-secret-key')
                    .then((v) => expect(v).to.deep.equal(Buffer.from('test-secret-value\n', 'utf8')))
            })
        })

        it('should return the name', () => {
            let b = new ConfigTreeBinding('testdata/test-k8s')

            expect(b.getName()).to.equal('test-k8s')
        })
    })

    describe('MapBinding', () => {

        describe('getAsBytes', () => {

            it('should return undefined for a missing key', () => {
                let b = new MapBinding('test-name', new Map<string, Buffer>([
                    ['test-secret-key', Buffer.from('test-secret-value\n', 'utf8')]
                ]))

                return b.getAsBytes('test-missing-key')
                    .then((v) => expect(v).to.be.undefined)
            })

            it('should return undefined for a invalid key', () => {
                let b = new MapBinding('test-name', new Map<string, Buffer>([
                    ['test-secret-key', Buffer.from('test-secret-value\n', 'utf8')]
                ]))

                return b.getAsBytes('test^invalid^key')
                    .then((v) => expect(v).to.be.undefined)
            })

            it('should return buffer', () => {
                let b = new MapBinding('test-name', new Map<string, Buffer>([
                    ['test-secret-key', Buffer.from('test-secret-value\n', 'utf8')]
                ]))

                return b.getAsBytes('test-secret-key')
                    .then((v) => expect(v).to.deep.equal(Buffer.from('test-secret-value\n', 'utf8')))
            })
        })

        it('should return the name', () => {
            let b = new MapBinding('test-name', new Map<string, Buffer>())

            expect(b.getName()).to.equal('test-name')
        })
    })
})


class StubBinding implements Binding {

    getAsBytesCount = 0

    getNameCount = 0

    getAsBytes(key: string): Promise<Buffer | undefined> {
        this.getAsBytesCount++

        if (key == 'test-key') {
            return Promise.resolve(Buffer.from('test-value', 'utf8'))
        }

        return Promise.resolve(undefined)
    }

    getName(): string {
        this.getNameCount++
        return 'test-name'
    }

}
