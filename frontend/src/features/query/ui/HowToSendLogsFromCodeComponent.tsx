/* eslint-disable @typescript-eslint/no-explicit-any */
import { CopyOutlined, LoadingOutlined } from '@ant-design/icons';
import { App, Button, Modal, Spin, Tabs } from 'antd';
import React, { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { type Project, projectApi } from '../../../entity/projects';
import { copyToClipboard } from '../../../shared/lib';

interface Props {
  projectId: string;
  onClose: () => void;
}

export const HowToSendLogsFromCodeComponent = ({
  projectId,
  onClose,
}: Props): React.JSX.Element => {
  // Hooks
  const { message } = App.useApp();

  // States
  const [project, setProject] = useState<Project | null>(null);
  const [copyingStates, setCopyingStates] = useState<Record<string, boolean>>({});

  // Functions
  const loadInfo = async () => {
    const project = await projectApi.getProject(projectId);
    setProject(project);
  };

  const handleCopyToClipboard = async (text: string, type: string) => {
    setCopyingStates((prev) => ({ ...prev, [type]: true }));

    try {
      const success = await copyToClipboard(text);
      if (success) {
        message.success(`${type} copied to clipboard!`);
      } else {
        message.error(`Failed to copy ${type}`);
      }
    } finally {
      // Keep the loading state for a brief moment to show feedback
      setTimeout(() => {
        setCopyingStates((prev) => ({ ...prev, [type]: false }));
      }, 300);
    }
  };

  // useEffect hooks
  useEffect(() => {
    loadInfo();
  }, [projectId]);

  // Calculated values
  const baseUrl = window.origin;
  const apiKeyLine = project?.isApiKeyRequired
    ? `  -H "X-API-Key: YOUR_API_KEY_HERE" \\
`
    : '';
  const curlExample = `curl -X POST "${baseUrl}/api/v1/logs/receiving/${projectId}" \\
${apiKeyLine}  -H "Content-Type: application/json" \\
  -d '{
    "logs": [
      {
        "level": "INFO",
        "message": "User logged in successfully",
        "fields": {
          "userId": "12345",
          "username": "john_doe",
          "ip": "192.168.1.100"
        }
      }
    ]
  }'`;

  const tabItems = [
    {
      key: 'curl',
      label: 'cURL',
      children: (
        <div>
          <div style={{ marginBottom: 8 }}>
            <strong>Basic cURL example:</strong>
          </div>

          <div style={{ position: 'relative' }}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              loading={copyingStates['cURL']}
              onClick={() => handleCopyToClipboard(curlExample, 'cURL')}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.8)',
                border: 'none',
              }}
            />
            {React.createElement(
              SyntaxHighlighter as React.ComponentType<any>,
              {
                language: 'bash',
                style: oneDark,
                customStyle: {
                  margin: 0,
                  borderRadius: '4px',
                  fontSize: '12px',
                },
              },
              curlExample,
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="How to send logs from code?"
      open={true}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      {!project ? (
        <Spin indicator={<LoadingOutlined spin />} />
      ) : (
        <div>
          <div style={{ marginBottom: 16 }}>
            {project.isApiKeyRequired && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '8px 12px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '4px',
                }}
              >
                <strong style={{ color: '#856404' }}>
                  📝 API Key Required: This project requires an X-API-Key header. Create an API key
                  in your project settings.
                </strong>
              </div>
            )}

            {project.isFilterByDomain && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '8px 12px',
                  backgroundColor: '#d1ecf1',
                  border: '1px solid #bee5eb',
                  borderRadius: '4px',
                }}
              >
                <strong style={{ color: '#0c5460' }}>
                  🌐 Domain Filtering: This project filters by domain. Allowed domains:{' '}
                  {project.allowedDomains.join(', ')}
                </strong>
              </div>
            )}

            {project.isFilterByIp && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '8px 12px',
                  backgroundColor: '#d1ecf1',
                  border: '1px solid #bee5eb',
                  borderRadius: '4px',
                }}
              >
                <strong style={{ color: '#0c5460' }}>
                  🔒 IP Filtering: This project filters by IP address. Allowed IPs:{' '}
                  {project.allowedIps.join(', ')}
                </strong>
              </div>
            )}
          </div>

          <div className="mb-4 flex">
            <div className="mr-5 w-80">
              <div className="mb-1">
                <span className="text-xs font-medium text-gray-600">LogBull URL:</span>
              </div>
              <div className="flex items-center justify-between rounded border border-gray-200 bg-gray-100 px-3 py-1.5">
                <span className="truncate font-mono text-xs text-gray-800">{baseUrl}</span>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  loading={copyingStates['logbull-url']}
                  onClick={() => handleCopyToClipboard(baseUrl, 'LogBull URL')}
                  className="ml-2 h-5 min-w-5 p-0.5 text-gray-600"
                />
              </div>
            </div>

            <div className="w-80">
              <div className="mb-1">
                <span className="text-xs font-medium text-gray-600">Project ID:</span>
              </div>
              <div className="flex items-center justify-between rounded border border-gray-200 bg-gray-100 px-3 py-1.5">
                <span className="truncate font-mono text-xs text-gray-800">{projectId}</span>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  loading={copyingStates['project-id']}
                  onClick={() => handleCopyToClipboard(projectId, 'Project ID')}
                  className="ml-2 h-5 min-w-5 p-0.5 text-gray-600"
                />
              </div>
            </div>
          </div>

          <Tabs defaultActiveKey="curl" items={tabItems} />
        </div>
      )}
    </Modal>
  );
};
