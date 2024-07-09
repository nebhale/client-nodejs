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


import {isValidSecretKey} from './secret.js'

import {expect} from 'chai'
import 'mocha'

describe('isValidSecretKey', () => {
    it('valid', () => {
        let valid = [
            'alpha',
            'BRAVO',
            'Charlie',
            'delta01',
            'echo-foxtrot',
            'golf_hotel',
            'india.juliet',
            '.kilo',
        ]

        for (const v of valid) {
            expect(isValidSecretKey(v)).to.be.true
        }
    })

    it('invalid', () => {
        let invalid = [
            'lima^mike'
        ]

        for (const i of invalid) {
            expect(isValidSecretKey(i)).to.be.false
        }
    })
})
