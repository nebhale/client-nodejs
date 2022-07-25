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

describe('get', () => {
    it('missing', async () => {
        const b = new MapBinding('test-name', new Map<string, Buffer>())
        expect(await get(b, 'test-missing-key')).to.be.undefined
    })

    it('valid', async () => {
        const b = new MapBinding('test-name', new Map<string, Buffer>([
            ['test-secret-key', Buffer.from('test-secret-value\n', 'utf8')]
        ]))

        expect(await get(b, 'test-secret-key')).to.equal('test-secret-value');
    })
})

describe('getProvider', () => {
    it('missing', async () => {
        const b = new MapBinding('test-name', new Map<string, Buffer>())
        expect(await getProvider(b)).to.be.undefined;
    })

    it('valid', async () => {
        const b = new MapBinding('test-name', new Map<string, Buffer>([
            ['provider', Buffer.from('test-provider-1', 'utf8')]
        ]))

        const v = await getProvider(b);
        expect(v).to.equal('test-provider-1');
    })
})

describe('getType', () => {
    it('invalid', async () => {
        const b = new MapBinding('test-name', new Map<string, Buffer>())

        try {
            await getType(b);
        } catch (e: any) {
            expect(e.message).to.equal('binding does not contain a type');
        }
    })

    it('valid', async () => {
        const b = new MapBinding('test-name', new Map<string, Buffer>([
            ['type', Buffer.from('test-type-1', 'utf8')]
        ]))

        expect(await getType(b)).to.equal('test-type-1');
    })
})

describe('CacheBinding', () => {
    it('missing', async () => {
        const s = new StubBinding()
        const b = new CacheBinding(s)

        expect(await b.getAsBytes("test-unknown-key")).to.be.undefined
        expect(await b.getAsBytes("test-unknown-key")).to.be.undefined
        expect(s.getAsBytesCount).to.equal(2)
    })

    it('valid', async () => {
        const s = new StubBinding()
        const b = new CacheBinding(s)

        expect(await b.getAsBytes("test-secret-key")).to.not.be.empty
        expect(await b.getAsBytes("test-secret-key")).to.not.be.empty
        expect(s.getAsBytesCount).to.equal(1)
    })

    it('getName', () => {
        const s = new StubBinding()
        const b = new CacheBinding(s)

        expect(b.getName()).to.not.be.empty
        expect(b.getName()).to.not.be.empty
        expect(s.getNameCount).to.equal(2)
    })
})

describe('ConfigTreeBinding', () => {
    it('missing', async () => {
        const b = new ConfigTreeBinding('testdata/test-k8s')
        expect(await b.getAsBytes('test-missing-key')).to.be.undefined
    })

    it('directory', async () => {
        const b = new ConfigTreeBinding('testdata/test-k8s')
        expect(await b.getAsBytes('.hidden-data')).to.be.undefined
    })

    it('invalid', async () => {
        const b = new ConfigTreeBinding('testdata/test-k8s')
        expect(await b.getAsBytes('test^invalid^key')).to.be.undefined
    })

    it('valid', async () => {
        const b = new ConfigTreeBinding('testdata/test-k8s')
        expect(await b.getAsBytes('test-secret-key')).to.deep.equal(Buffer.from('test-secret-value\n', 'utf8'))
    })


    it('getName', () => {
        const b = new ConfigTreeBinding('testdata/test-k8s')
        expect(b.getName()).to.equal('test-k8s')
    })
})

describe('MapBinding', () => {
    it('missing', async () => {
        const b = new MapBinding('test-name', new Map<string, Buffer>())
        expect(await b.getAsBytes('test-missing-key')).to.be.undefined
    })

    it('invalid', async () => {
        const b = new MapBinding('test-name', new Map<string, Buffer>())
        expect(await b.getAsBytes('test^invalid^key')).to.be.undefined
    })

    it('valid', async () => {
        const b = new MapBinding('test-name', new Map<string, Buffer>([
            ['test-secret-key', Buffer.from('test-secret-value\n', 'utf8')]
        ]))

        expect(await b.getAsBytes('test-secret-key')).to.deep.equal(Buffer.from('test-secret-value\n', 'utf8'))
    })

    it('getName', () => {
        const b = new MapBinding('test-name', new Map<string, Buffer>())
        expect(b.getName()).to.equal('test-name')
    })
})


class StubBinding implements Binding {
    getAsBytesCount = 0
    getNameCount = 0

    async getAsBytes(key: string): Promise<Buffer | undefined> {
        this.getAsBytesCount++

        if (key == 'test-secret-key') {
            return Buffer.from('test-value', 'utf8')
        }

        return undefined
    }

    getName(): string {
        this.getNameCount++
        return 'test-name'
    }
}
