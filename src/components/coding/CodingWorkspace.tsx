import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { codingClient } from '../../lib/codingWorkspaceClient';

export function CodingWorkspace({ modifiedPrompt, onComplete }: { modifiedPrompt: any; onComplete: (r: any)=>void }) {
  const [fs, setFs] = useState<Array<{ path: string; content: string }>>([]);
  const [active, setActive] = useState<string>('');
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');

  useEffect(() => { void init(); }, []);

  async function init() {
    const res = await codingClient.start({ language: 'ts', focusAreas: modifiedPrompt?.practice_focus || [] });
    if (res?.ok) {
      setFs(res.data.fs);
      setActive(res.data.fs[0]?.path || '');
    }
  }

  function updateFile(path: string, content: string) {
    setFs(prev => prev.map(f => f.path === path ? { ...f, content } : f));
  }

  async function runTests() {
    const res = await codingClient.run({ fs, language: 'ts', tests: true });
    if (res?.ok) {
      setStdout(res.data.stdout || '');
      setStderr(res.data.stderr || '');
    }
  }

  async function submitForReview() {
    // Placeholder: wire Alex.final in a later phase
    onComplete({ submitted: true });
  }

  const current = fs.find(f => f.path === active);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 border rounded p-2 h-[70vh] overflow-auto">
        <ul className="text-sm space-y-1">
          {fs.map(f => (
            <li key={f.path} className={`cursor-pointer ${active === f.path ? 'font-semibold' : ''}`} onClick={() => setActive(f.path)}>
              {f.path}
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-6 border rounded p-0 h-[70vh]">
        <textarea
          className="w-full h-full p-3 font-mono text-sm"
          value={current?.content || ''}
          onChange={(e) => current && updateFile(current.path, e.target.value)}
        />
      </div>
      <div className="col-span-3 space-y-3">
        <Button onClick={runTests} className="w-full">Run Tests</Button>
        <Button onClick={submitForReview} className="w-full">Submit for Review</Button>
        <div className="border rounded p-2 h-60 overflow-auto">
          <pre className="text-xs whitespace-pre-wrap">{stdout || 'Output...'}</pre>
          {stderr && (<div className="text-red-600 text-xs mt-2">{stderr}</div>)}
        </div>
      </div>
    </div>
  );
}


