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

import {Binding, CacheBinding, MapBinding} from './binding'
import {cached, filter, find, from, fromServiceBindingRoot} from './bindings'

import {expect} from 'chai'
import 'mocha'

it('cached', () => {
    const b = cached(new Array<Binding>(
        new MapBinding('test-name-1', new Map<string, Buffer>()),
        new MapBinding('test-name-2', new Map<string, Buffer>()),
    ))

    b.forEach((c) => {
        expect(c.constructor.name).to.equal(CacheBinding.name)
    });
})

describe('from', () => {
    it('missing', async () => {
        expect(await from("missing")).to.be.empty;
    })

    it('file', async () => {
        expect(await from("testdata/additional-file")).to.be.empty;
    })

    it('valid', async () => {
        expect(await from("testdata")).to.have.length(3);
    })
})

describe('fromServiceBindingRoot', () => {
    it('unset', async () => {
        expect(await fromServiceBindingRoot()).to.be.empty;
    })

    it('set', async () => {
        const old = process.env['SERVICE_BINDING_ROOT']
        process.env['SERVICE_BINDING_ROOT'] = 'testdata'

        try {
            expect(await fromServiceBindingRoot()).to.have.length(3)
        } finally {
            if (old == undefined) {
                delete process.env.SERVICE_BINDING_ROOT
            } else {
                process.env['SERVICE_BINDING_ROOT'] = old
            }
        }
    })
})

describe('find', () => {
    it('missing', () => {
        const b = new Array<Binding>(
            new MapBinding('test-name-1', new Map<string, Buffer>()),
        )

        expect(find(b, 'test-name-2')).to.be.undefined
    })

    it('valid', () => {
        const b = new Array<Binding>(
            new MapBinding('test-name-1', new Map<string, Buffer>()),
            new MapBinding('test-name-2', new Map<string, Buffer>()),
        )

        expect(find(b, 'test-name-1')?.getName()).to.equal('test-name-1')
    })
})

describe('filter', () => {
    it('none', async () => {
        const b = new Array<Binding>(
            new MapBinding('test-name-1', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-1', 'utf8')],
                ['provider', Buffer.from('test-provider-1', 'utf8')],
            ])),
            new MapBinding('test-name-2', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-1', 'utf8')],
                ['provider', Buffer.from('test-provider-2', 'utf8')],
            ])),
            new MapBinding('test-name-3', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-2', 'utf8')],
                ['provider', Buffer.from('test-provider-2', 'utf8')],
            ])),
            new MapBinding('test-name-4', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-2', 'utf8')],
            ])),
        )

        expect(await filter(b)).to.have.length(4)
    })

    it('type', async () => {
        const b = new Array<Binding>(
            new MapBinding('test-name-1', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-1', 'utf8')],
                ['provider', Buffer.from('test-provider-1', 'utf8')],
            ])),
            new MapBinding('test-name-2', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-1', 'utf8')],
                ['provider', Buffer.from('test-provider-2', 'utf8')],
            ])),
            new MapBinding('test-name-3', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-2', 'utf8')],
                ['provider', Buffer.from('test-provider-2', 'utf8')],
            ])),
            new MapBinding('test-name-4', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-2', 'utf8')],
            ])),
        )

        expect(await filter(b, 'test-type-1')).to.have.length(2)
    })

    it('provider', async () => {
        const b = new Array<Binding>(
            new MapBinding('test-name-1', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-1', 'utf8')],
                ['provider', Buffer.from('test-provider-1', 'utf8')],
            ])),
            new MapBinding('test-name-2', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-1', 'utf8')],
                ['provider', Buffer.from('test-provider-2', 'utf8')],
            ])),
            new MapBinding('test-name-3', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-2', 'utf8')],
                ['provider', Buffer.from('test-provider-2', 'utf8')],
            ])),
            new MapBinding('test-name-4', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-2', 'utf8')],
            ])),
        )

        expect(await filter(b, undefined, 'test-provider-2')).to.have.length(2)
    })

    it('type and provider', async () => {
        const b = new Array<Binding>(
            new MapBinding('test-name-1', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-1', 'utf8')],
                ['provider', Buffer.from('test-provider-1', 'utf8')],
            ])),
            new MapBinding('test-name-2', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-1', 'utf8')],
                ['provider', Buffer.from('test-provider-2', 'utf8')],
            ])),
            new MapBinding('test-name-3', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-2', 'utf8')],
                ['provider', Buffer.from('test-provider-2', 'utf8')],
            ])),
            new MapBinding('test-name-4', new Map<string, Buffer>([
                ['type', Buffer.from('test-type-2', 'utf8')],
            ])),
        )

        expect(await filter(b, 'test-type-1', 'test-provider-1')).to.have.length(1)
    })
})
