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

const validSecretKey: RegExp = new RegExp('^[A-Za-z0-9\-_.]+$')

/**
 * Tests whether a {@link string} is a valid
 * <a href="https://kubernetes.io/docs/concepts/configuration/secret/#overview-of-secrets">Kubernetes Secret key</a>.
 *
 * @param key the key to check
 * @return `true` if the {@link string} is a valid Kubernetes Secret key, otherwise `false`
 */
export function isValidSecretKey(key: string): boolean {
    return validSecretKey.test(key)
}
