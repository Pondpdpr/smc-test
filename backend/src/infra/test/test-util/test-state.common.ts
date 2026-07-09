// testState.ts
import * as fs from 'fs';
import * as path from 'path';

const STATE_FILE = path.join(process.cwd(), '.test-state.json');

export type JestTestState = {
  requireDbSetup: boolean;
};

export function getTestState(): JestTestState {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    // Initial state if file doesn't exist
    const initialState: JestTestState = { requireDbSetup: true };
    fs.writeFileSync(STATE_FILE, JSON.stringify(initialState));
    return initialState;
  }
}

export function updateTestState(newState: Partial<JestTestState>) {
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({
      ...getTestState(),
      ...newState,
    }),
  );
}
