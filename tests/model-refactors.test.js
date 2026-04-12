/**
 * Tests for model-layer refactors:
 * - AdminModel.updateAdmin() last-super-admin guard
 * - CancerTypeModel.getAssessmentConfig()
 * Run: NODE_ENV=test node --test tests/model-refactors.test.js
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { setup, teardown } from './helpers/setup.js';
import { AdminModel } from '../models/adminModel.js';
import { CancerTypeModel } from '../models/cancerTypeModel.js';

describe('AdminModel.updateAdmin — last super admin guard', () => {
    before(async () => { await setup(); });
    after(async () => { await teardown(); });

    it('throws when demoting the only super_admin', async () => {
        const model = new AdminModel();
        const admins = await model.getAllAdmins();
        const superAdmin = admins.find(a => a.role === 'super_admin');
        assert.ok(superAdmin, 'fixture should have a super_admin');

        await assert.rejects(
            () => model.updateAdmin(superAdmin.id, { role: 'admin' }),
            (err) => {
                assert.ok(err.message.includes('Cannot demote the last super admin'));
                return true;
            }
        );
    });

    it('allows demoting a super_admin when another exists', async () => {
        const model = new AdminModel();
        // Create a second super admin
        const second = await model.createAdmin({
            email: 'second-sa@test.com',
            name: 'Second SA',
            role: 'super_admin',
            password: 'password123'
        });

        // Demoting the second should succeed now
        const updated = await model.updateAdmin(second.id, { role: 'admin' });
        assert.strictEqual(updated.role, 'admin');
    });

    it('allows updating non-role fields without triggering the guard', async () => {
        const model = new AdminModel();
        const admins = await model.getAllAdmins();
        const superAdmin = admins.find(a => a.role === 'super_admin');

        // Updating name should work fine
        const updated = await model.updateAdmin(superAdmin.id, { name: 'New Name' });
        assert.strictEqual(updated.name, 'New Name');
    });
});

describe('CancerTypeModel.getAssessmentConfig', () => {
    before(async () => { await setup(); });
    after(async () => { await teardown(); });

    it('returns null for non-existent cancer type', async () => {
        const model = new CancerTypeModel();
        const config = await model.getAssessmentConfig('nonexistent');
        assert.strictEqual(config, null);
    });

    it('returns parsed config with correct fields for existing cancer type', async () => {
        const model = new CancerTypeModel();
        const config = await model.getAssessmentConfig('colorectal');
        assert.ok(config, 'colorectal should exist in fixtures');
        assert.strictEqual(typeof config.familyWeight, 'number');
        assert.strictEqual(typeof config.ageRiskThreshold, 'number');
        assert.strictEqual(typeof config.ageRiskWeight, 'number');
        assert.strictEqual(typeof config.ethnicityRisk, 'object');
        assert.strictEqual(typeof config.ethnicityRisk.chinese, 'number');
        assert.strictEqual(typeof config.ethnicityRisk.malay, 'number');
        assert.strictEqual(typeof config.ethnicityRisk.indian, 'number');
        assert.strictEqual(typeof config.ethnicityRisk.caucasian, 'number');
        assert.strictEqual(typeof config.ethnicityRisk.others, 'number');
    });

    it('returns correct values matching fixture data', async () => {
        const model = new CancerTypeModel();
        // colorectal in fixture: familyWeight=10, ageRiskThreshold=50, ageRiskWeight=5
        const config = await model.getAssessmentConfig('colorectal');
        assert.strictEqual(config.familyWeight, 10);
        assert.strictEqual(config.ageRiskThreshold, 50);
        assert.strictEqual(config.ageRiskWeight, 5);
    });
});

