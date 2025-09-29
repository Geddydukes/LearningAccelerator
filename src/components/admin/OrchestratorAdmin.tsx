import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { 
  RefreshCw, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Activity,
  Users,
  Workflow
} from 'lucide-react';

interface JobQueue {
  job_id: string;
  workflow_run_id: string;
  step_id: string;
  user_id: string;
  intent_id?: string;
  status: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  next_run_at: string;
  created_at: string;
  updated_at: string;
}

interface JobAttempt {
  attempt_id: string;
  job_id: string;
  started_at: string;
  finished_at?: string;
  success?: boolean;
  status_code?: number;
  error_text?: string;
}

interface WorkflowRun {
  workflow_run_id: string;
  workflow_key: string;
  user_id: string;
  intent_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function OrchestratorAdmin() {
  const [jobs, setJobs] = useState<JobQueue[]>([]);
  const [attempts, setAttempts] = useState<JobAttempt[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedIntent, setSelectedIntent] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // In a real app, you'd call your API endpoints
      // For now, we'll simulate the data
      await Promise.all([
        loadJobs(),
        loadAttempts(),
        loadWorkflows()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    // Simulate API call
    const mockJobs: JobQueue[] = [
      {
        job_id: 'job-1',
        workflow_run_id: 'run-1',
        step_id: 'clo_begin_week',
        user_id: 'user-1',
        status: 'queued',
        priority: 100,
        attempts: 0,
        max_attempts: 5,
        next_run_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        job_id: 'job-2',
        workflow_run_id: 'run-1',
        step_id: 'ta_generate_week',
        user_id: 'user-1',
        status: 'running',
        priority: 100,
        attempts: 1,
        max_attempts: 5,
        next_run_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    setJobs(mockJobs);
  };

  const loadAttempts = async () => {
    // Simulate API call
    const mockAttempts: JobAttempt[] = [
      {
        attempt_id: 'attempt-1',
        job_id: 'job-1',
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        success: true,
        status_code: 200
      },
      {
        attempt_id: 'attempt-2',
        job_id: 'job-2',
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        success: false,
        status_code: 500,
        error_text: 'Timeout error'
      }
    ];
    setAttempts(mockAttempts);
  };

  const loadWorkflows = async () => {
    // Simulate API call
    const mockWorkflows: WorkflowRun[] = [
      {
        workflow_run_id: 'run-1',
        workflow_key: 'weekly_seed_v1',
        user_id: 'user-1',
        status: 'running',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    setWorkflows(mockWorkflows);
  };

  const triggerDailyInstructor = async () => {
    if (!selectedUser) {
      alert('Please select a user');
      return;
    }

    try {
      // In a real app, call your dispatch endpoint
      console.log(`Triggering daily instructor for user: ${selectedUser}`);
      alert('Daily instructor workflow triggered!');
      
      // Reload data after a delay
      setTimeout(loadData, 2000);
    } catch (error) {
      console.error('Error triggering workflow:', error);
      alert('Error triggering workflow');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      case 'dead': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'running': return <Activity className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'queued': return <Clock className="w-4 h-4" />;
      case 'dead': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Orchestrator Admin</h1>
          <p className="text-white/70">Monitor and manage workflow execution</p>
        </div>
        <Button onClick={loadData} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Play className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription className="text-white/70">
            Manually trigger workflows for specific users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="user-select" className="text-white">User ID</Label>
              <Input
                id="user-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                placeholder="Enter user ID"
                className="mt-1 bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="intent-select" className="text-white">Intent ID (Optional)</Label>
              <Input
                id="intent-select"
                value={selectedIntent}
                onChange={(e) => setSelectedIntent(e.target.value)}
                placeholder="Enter intent ID"
                className="mt-1 bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={triggerDailyInstructor}
                disabled={!selectedUser}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Trigger Daily Instructor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Queue */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            Job Queue ({jobs.length})
          </CardTitle>
          <CardDescription className="text-white/70">
            Current jobs in the execution queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-white/70 p-2">Job ID</th>
                  <th className="text-left text-white/70 p-2">Step</th>
                  <th className="text-left text-white/70 p-2">User</th>
                  <th className="text-left text-white/70 p-2">Status</th>
                  <th className="text-left text-white/70 p-2">Attempts</th>
                  <th className="text-left text-white/70 p-2">Next Run</th>
                  <th className="text-left text-white/70 p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.job_id} className="border-b border-white/10">
                    <td className="p-2 text-white font-mono text-xs">{job.job_id.slice(0, 8)}...</td>
                    <td className="p-2 text-white">{job.step_id}</td>
                    <td className="p-2 text-white font-mono text-xs">{job.user_id.slice(0, 8)}...</td>
                    <td className="p-2">
                      <Badge className={getStatusColor(job.status)}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1">{job.status}</span>
                      </Badge>
                    </td>
                    <td className="p-2 text-white">{job.attempts}/{job.max_attempts}</td>
                    <td className="p-2 text-white text-xs">
                      {new Date(job.next_run_at).toLocaleString()}
                    </td>
                    <td className="p-2 text-white text-xs">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Job Attempts */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Job Attempts ({attempts.length})
          </CardTitle>
          <CardDescription className="text-white/70">
            Recent job execution attempts and results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-white/70 p-2">Attempt ID</th>
                  <th className="text-left text-white/70 p-2">Job ID</th>
                  <th className="text-left text-white/70 p-2">Started</th>
                  <th className="text-left text-white/70 p-2">Finished</th>
                  <th className="text-left text-white/70 p-2">Success</th>
                  <th className="text-left text-white/70 p-2">Status</th>
                  <th className="text-left text-white/70 p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.attempt_id} className="border-b border-white/10">
                    <td className="p-2 text-white font-mono text-xs">{attempt.attempt_id.slice(0, 8)}...</td>
                    <td className="p-2 text-white font-mono text-xs">{attempt.job_id.slice(0, 8)}...</td>
                    <td className="p-2 text-white text-xs">
                      {new Date(attempt.started_at).toLocaleString()}
                    </td>
                    <td className="p-2 text-white text-xs">
                      {attempt.finished_at ? new Date(attempt.finished_at).toLocaleString() : '-'}
                    </td>
                    <td className="p-2">
                      <Badge className={attempt.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {attempt.success ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="p-2 text-white">{attempt.status_code || '-'}</td>
                    <td className="p-2 text-white text-xs max-w-xs truncate">
                      {attempt.error_text || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Runs */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Workflow Runs ({workflows.length})
          </CardTitle>
          <CardDescription className="text-white/70">
            High-level workflow execution status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-white/70 p-2">Run ID</th>
                  <th className="text-left text-white/70 p-2">Workflow</th>
                  <th className="text-left text-white/70 p-2">User</th>
                  <th className="text-left text-white/70 p-2">Status</th>
                  <th className="text-left text-white/70 p-2">Created</th>
                  <th className="text-left text-white/70 p-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((workflow) => (
                  <tr key={workflow.workflow_run_id} className="border-b border-white/10">
                    <td className="p-2 text-white font-mono text-xs">{workflow.workflow_run_id.slice(0, 8)}...</td>
                    <td className="p-2 text-white">{workflow.workflow_key}</td>
                    <td className="p-2 text-white font-mono text-xs">{workflow.user_id.slice(0, 8)}...</td>
                    <td className="p-2">
                      <Badge className={getStatusColor(workflow.status)}>
                        {getStatusIcon(workflow.status)}
                        <span className="ml-1">{workflow.status}</span>
                      </Badge>
                    </td>
                    <td className="p-2 text-white text-xs">
                      {new Date(workflow.created_at).toLocaleString()}
                    </td>
                    <td className="p-2 text-white text-xs">
                      {new Date(workflow.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 