import { promises as fs } from 'fs';
import path from 'path';
import YAML from 'yaml';

type Workflow = {
  on?: Record<string, unknown>;
  permissions?: Record<string, string>;
  concurrency?: { group?: string; 'cancel-in-progress'?: boolean };
  jobs?: Record<string, { steps?: Array<Record<string, unknown>> }>;
};

const workflow = async (name: string): Promise<Workflow> =>
  YAML.parse(
    await fs.readFile(
      path.resolve(__dirname, '../../../.github/workflows', name),
      'utf8',
    ),
  ) as Workflow;

const uses = (steps: Array<Record<string, unknown>>, action: string): boolean =>
  steps.some((step) => step.uses === action);

describe('release PR workflows', () => {
  test('CI exposes one read-only validate gate on master pushes and PRs', async () => {
    const ci = await workflow('ci.yml');
    expect(Object.keys(ci.on ?? {})).toEqual(['push', 'pull_request']);
    expect(ci.permissions).toEqual({ contents: 'read' });
    expect(Object.keys(ci.jobs ?? {})).toEqual(['validate']);
    const steps = ci.jobs?.validate.steps ?? [];
    expect(uses(steps, 'actions/checkout@v6')).toBe(true);
    expect(uses(steps, 'actions/setup-node@v6')).toBe(true);
    expect(steps.some((step) => step.run === 'npm ci')).toBe(true);
  });

  test('the updater has one serialized schedule and withholds App credentials from diagnostics', async () => {
    const update = await workflow('update-data.yml');
    expect(update.on?.schedule).toEqual([{ cron: '0 5 * * 1' }]);
    expect(update.concurrency).toEqual({
      group: 'update-iana-data',
      'cancel-in-progress': false,
    });
    const steps = update.jobs?.['update-data'].steps ?? [];
    const appToken = steps.find(
      (step) => step.uses === 'actions/create-github-app-token@v3',
    );
    expect(appToken?.if).toContain("steps.sweep.outputs.diagnostic == 'false'");
    expect(uses(steps, 'peter-evans/create-pull-request@v8')).toBe(true);
    await expect(
      fs.access(
        path.resolve(
          __dirname,
          '../../../.github/workflows/check-for-new-data-and-create-pr.yml',
        ),
      ),
    ).rejects.toThrow();
  });
});
