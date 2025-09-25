import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { callEducationAgent } from '../../lib/educationAgentClient';
import { CodingWorkspace } from '../coding/CodingWorkspace';

type Phase = 'planning'|'lecture'|'check'|'practice_prep'|'practice'|'reflect'|'completed';

export function EducationAgentWorkspace() {
  const [phase, setPhase] = useState<Phase>('planning');
  const [artifacts, setArtifacts] = useState<any>({});
  const [showCoding, setShowCoding] = useState(false);

  useEffect(() => { void startDay(); }, []);

  async function startDay() {
    const res = await callEducationAgent({ event: 'start_day' });
    if (res?.ok) {
      setArtifacts((a: any) => ({ ...a, lecture: res.lecture }));
      setPhase('lecture');
    }
  }
  async function lectureDone() {
    const res = await callEducationAgent({ event: 'lecture_done', payload: { lectureContext: artifacts.lecture } });
    if (res?.ok) {
      setArtifacts((a: any) => ({ ...a, comprehension: res.comprehension }));
      setPhase('check');
    }
  }
  async function checkDone() {
    const res = await callEducationAgent({ event: 'check_done', payload: { understandingMap: artifacts?.comprehension?.understanding_map, cloDailyPrompts: artifacts?.lecture?.clo_day } });
    if (res?.ok) {
      setArtifacts((a: any) => ({ ...a, modifiedPrompts: res.modifiedPrompts }));
      setPhase('practice_prep');
    }
  }
  function openCoding() {
    setShowCoding(true);
    setPhase('practice');
  }
  async function practiceDone(results: any) {
    await callEducationAgent({ event: 'practice_done', payload: { results } });
    setPhase('reflect');
  }

  return (
    <div className="p-6 space-y-4">
      <Card className="p-4">Phase: {phase}</Card>

      {phase === 'lecture' && (
        <Card className="p-4 space-y-3">
          <div>{artifacts?.lecture?.lecture_content_md ? 'Lecture ready' : 'Preparing lecture...'}</div>
          <Button onClick={lectureDone}>Continue</Button>
        </Card>
      )}

      {phase === 'check' && (
        <Card className="p-4 space-y-3">
          <div>Comprehension questions ready</div>
          <Button onClick={checkDone}>Check Understanding</Button>
        </Card>
      )}

      {phase === 'practice_prep' && (
        <Card className="p-4 space-y-3">
          <div>Choose your practice mode</div>
          <div className="flex gap-2">
            <Button onClick={openCoding}>Open Coding Workspace</Button>
            <Button onClick={() => setPhase('practice')}>Start Socratic</Button>
          </div>
        </Card>
      )}

      {phase === 'practice' && showCoding && (
        <CodingWorkspace modifiedPrompt={artifacts?.modifiedPrompts?.ta_prompt_modified} onComplete={practiceDone} />
      )}
    </div>
  );
}


