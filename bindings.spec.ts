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

describe('bindings', () => {

    describe('cached', () => {

        it('should wrap with CacheBinding', () => {
            const b = cached(new Array<Binding>(
                new MapBinding('test-name-1', new Map<string, Buffer>()),
                new MapBinding('test-name-2', new Map<string, Buffer>()),
            ))

            b.forEach((c) => {
                expect(c.constructor.name).to.equal(CacheBinding.name)
            });
        })
    })

    describe('from', () => {

        it('should create empty Bindings if directory does not exist', async () => {
            const v = await from("missing");
            expect(v).to.be.empty;
        })

        it('should create empty Bindings if not a directory', async () => {
            const v = await from("testdata/additional-file");
            expect(v).to.be.empty;
        })

        it('should create Bindings', async () => {
            const v = await from("testdata");
            expect(v).to.have.length(3);
        })
    })

    describe('fromServiceBindingRoot', () => {

        it('should create empty Bindings if $SERVICE_BINDING_ROOT is not set', async () => {
            const v = await fromServiceBindingRoot();
            expect(v).to.be.empty;
        })

        it('should create Bindings', async () => {
            const old = process.env['SERVICE_BINDING_ROOT']
            process.env['SERVICE_BINDING_ROOT'] = 'testdata'

            try {
                const v = await fromServiceBindingRoot()
                expect(v).to.have.length(3)
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

        it('should return undefined if no Binding with name exists', () => {
            const b = new Array<Binding>(
                new MapBinding('test-name-1', new Map<string, Buffer>()),
            )

            expect(find(b, 'test-name-2')).to.be.undefined
        })

        it('should return Binding', () => {
            const b = new Array<Binding>(
                new MapBinding('test-name-1', new Map<string, Buffer>()),
                new MapBinding('test-name-2', new Map<string, Buffer>()),
            )

            expect(find(b, 'test-name-1')?.getName()).to.equal('test-name-1')
        })
    })

    describe('filter', () => {

        it('should return no Bindings', async () => {
            const b = new Array<Binding>(
                new MapBinding('test-name-1', new Map<string, Buffer>([
                    ['type', Buffer.from('test-type-1', 'utf8')],
                    ['provider', Buffer.from('test-provider-1', 'utf8')],
                ])),
                new MapBinding('test-name-2', new Map<string, Buffer>([
                    ['type', Buffer.from('test-type-2', 'utf8')],
                ])),
            )

            const v = await filter(b, 'test-type-3');
            expect(v).to.be.empty;
        })

        it('should return a single Binding', async () => {
            const b = new Array<Binding>(
                new MapBinding('test-name-1', new Map<string, Buffer>([
                    ['type', Buffer.from('test-type-1', 'utf8')],
                    ['provider', Buffer.from('test-provider-1', 'utf8')],
                ])),
                new MapBinding('test-name-2', new Map<string, Buffer>([
                    ['type', Buffer.from('test-type-2', 'utf8')],
                ])),
            )

            const v = await filter(b, 'test-type-1');
            expect(v).to.have.length(1);
        })

        it('should return multiple bindings', async () => {
            const b = new Array<Binding>(
                new MapBinding('test-name-1', new Map<string, Buffer>([
                    ['type', Buffer.from('test-type-1', 'utf8')],
                    ['provider', Buffer.from('test-provider-1', 'utf8')],
                ])),
                new MapBinding('test-name-2', new Map<string, Buffer>([
                    ['type', Buffer.from('test-type-1', 'utf8')],
                ])),
            )

            const v = await filter(b, 'test-type-1');
            expect(v).to.have.length(2);
        })

        it('should filter by type and provider', async () => {
            const b = new Array<Binding>(
                new MapBinding('test-name-1', new Map<string, Buffer>([
                    ['type', Buffer.from('test-type-1', 'utf8')],
                    ['provider', Buffer.from('test-provider-1', 'utf8')],
                ])),
                new MapBinding('test-name-2', new Map<string, Buffer>([
                    ['type', Buffer.from('test-type-1', 'utf8')],
                    ['provider', Buffer.from('test-provider-2', 'utf8')],
                ])),
            )

            const v = await filter(b, 'test-type-1', 'test-provider-1');
            expect(v).to.have.length(1);
        })

        it('should filter by provider', async () => {
            const b = new Array<Binding>(
                new MapBinding('test-name-1', new Map<string, Buffer>([
                    ['type', Buffer.from('test-type-1', 'utf8')],
                    ['provider', Buffer.from('test-provider-1', 'utf8')],
                ])),
                new MapBinding('test-name-2', new Map<string, Buffer>([
                    ['type', Buffer.from('test-type-1', 'utf8')],
                    ['provider', Buffer.from('test-provider-2', 'utf8')],
                ])),
            )

            const v = await filter(b, undefined, 'test-provider-1');
            expect(v).to.have.length(1);
        })
    })
})
