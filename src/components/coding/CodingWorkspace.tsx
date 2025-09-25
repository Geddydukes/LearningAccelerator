import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { codingWorkspaceClient, CodingSession } from '../../lib/codingWorkspaceClient';
import { GlassCard } from '../design-system/GlassCard';
import { RippleButton } from '../design-system/RippleButton';

interface CodingWorkspaceProps {
  workspaceData?: any;
  onComplete: (results: any) => void;
  loading?: boolean;
}

interface FileSystem {
  [fileName: string]: {
    content: string;
    type: string;
  };
}

export const CodingWorkspace: React.FC<CodingWorkspaceProps> = ({
  workspaceData,
  onComplete,
  loading = false,
}) => {
  const [fileSystem, setFileSystem] = useState<FileSystem>({});
  const [activeFile, setActiveFile] = useState<string>('');
  const [runResult, setRunResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState<CodingSession | null>(null);
  const [taskBrief, setTaskBrief] = useState<any>(null);
  const [tests, setTests] = useState<string>('');
  const [gettingStarted, setGettingStarted] = useState<string>('');

  useEffect(() => {
    if (workspaceData) {
      setFileSystem(workspaceData.fileSystem || {});
      setTaskBrief(workspaceData.taskBrief);
      setTests(workspaceData.tests);
      setGettingStarted(workspaceData.gettingStarted);
      
      // Set first file as active
      const fileNames = Object.keys(workspaceData.fileSystem || {});
      if (fileNames.length > 0) {
        setActiveFile(fileNames[0]);
      }
    }
  }, [workspaceData]);

  const updateFileContent = (fileName: string, content: string) => {
    setFileSystem(prev => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        content,
      },
    }));
  };

  const runCode = async (runTests: boolean = false) => {
    if (!workspaceData?.sessionId) return;

    setRunning(true);
    setRunResult(null);

    try {
      const response = await codingWorkspaceClient.runCode(
        workspaceData.sessionId,
        workspaceData.sessionId,
        fileSystem,
        runTests,
        workspaceData.language
      );

      if (response.success && response.data) {
        setRunResult(response.data.result);
      } else {
        setRunResult({
          success: false,
          output: '',
          error: response.error || 'Failed to run code',
          exitCode: 1,
          type: runTests ? 'tests' : 'main',
        });
      }
    } catch (error) {
      setRunResult({
        success: false,
        output: '',
        error: error.message,
        exitCode: 1,
        type: runTests ? 'tests' : 'main',
      });
    } finally {
      setRunning(false);
    }
  };

  const submitForReview = async () => {
    if (!workspaceData?.sessionId) return;

    setRunning(true);

    try {
      const response = await codingWorkspaceClient.submitForReview(
        workspaceData.sessionId,
        workspaceData.sessionId,
        fileSystem,
        workspaceData.language
      );

      if (response.success) {
        onComplete({
          practiceType: 'coding',
          results: {
            submission: fileSystem,
            review: response.data,
          },
        });
      } else {
        alert('Failed to submit for review: ' + response.error);
      }
    } catch (error) {
      alert('Failed to submit for review: ' + error.message);
    } finally {
      setRunning(false);
    }
  };

  const fileNames = Object.keys(fileSystem);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold">
            {workspaceData?.language?.toUpperCase() || 'JavaScript'} Coding Workspace
          </h3>
          <p className="text-sm text-gray-600">
            Focus Areas: {workspaceData?.focusAreas?.join(', ') || 'General Programming'}
          </p>
        </div>
        <div className="flex space-x-2">
          <RippleButton
            onClick={() => runCode(false)}
            disabled={running}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {running ? 'Running...' : 'Run Code'}
          </RippleButton>
          <RippleButton
            onClick={() => runCode(true)}
            disabled={running}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {running ? 'Testing...' : 'Run Tests'}
          </RippleButton>
          <RippleButton
            onClick={submitForReview}
            disabled={running || loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {running ? 'Submitting...' : 'Submit for Review'}
          </RippleButton>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* File Explorer */}
        <div className="lg:col-span-1">
          <GlassCard className="h-full p-4">
            <h4 className="font-semibold mb-3">Files</h4>
            <div className="space-y-1">
              {fileNames.map(fileName => (
                <button
                  key={fileName}
                  onClick={() => setActiveFile(fileName)}
                  className={`w-full text-left p-2 rounded text-sm ${
                    activeFile === fileName
                      ? 'bg-blue-100 text-blue-800'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {fileName}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Code Editor */}
        <div className="lg:col-span-1">
          <GlassCard className="h-full p-4">
            <h4 className="font-semibold mb-3">{activeFile}</h4>
            <textarea
              value={fileSystem[activeFile]?.content || ''}
              onChange={(e) => updateFileContent(activeFile, e.target.value)}
              className="w-full h-full p-3 border rounded-lg font-mono text-sm resize-none"
              placeholder="Start coding..."
            />
          </GlassCard>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-1">
          <GlassCard className="h-full p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">Output</h4>
              {runResult && (
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    runResult.success
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {runResult.success ? 'SUCCESS' : 'FAILED'}
                </span>
              )}
            </div>

            {runResult ? (
              <div className="space-y-3">
                {runResult.output && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Output:</h5>
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
                      {runResult.output}
                    </pre>
                  </div>
                )}
                {runResult.error && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Error:</h5>
                    <pre className="bg-red-50 p-2 rounded text-xs overflow-auto max-h-32 text-red-700">
                      {runResult.error}
                    </pre>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Exit Code: {runResult.exitCode} | Type: {runResult.type}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Run your code to see output here
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Task Brief and Getting Started */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {taskBrief && (
          <GlassCard className="p-4">
            <h4 className="font-semibold mb-3">Task Brief</h4>
            <div className="prose prose-sm max-w-none">
              <h5>{taskBrief.title}</h5>
              <p>{taskBrief.description}</p>
              <h6>Objectives:</h6>
              <ul>
                {taskBrief.objectives?.map((obj: any, index: number) => (
                  <li key={index}>{obj.concept}: {obj.description}</li>
                ))}
              </ul>
              <h6>Requirements:</h6>
              <ul>
                {taskBrief.requirements?.map((req: string, index: number) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          </GlassCard>
        )}

        {gettingStarted && (
          <GlassCard className="p-4">
            <h4 className="font-semibold mb-3">Getting Started</h4>
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: gettingStarted.replace(/\n/g, '<br>') }} />
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};