'use client';

import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  Divider,
  Tag,
  Row,
  Col,
  List,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import type { DiagnosisMapping, BatchMappingResponse } from '@/types/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const DiagnosisMapper: React.FC = () => {
  const [singleDiagnosis, setSingleDiagnosis] = useState('');
  const [batchDiagnoses, setBatchDiagnoses] = useState<string[]>(['']);
  const [singleResult, setSingleResult] = useState<DiagnosisMapping | null>(null);
  const [batchResults, setBatchResults] = useState<DiagnosisMapping[]>([]);
  const [singleLoading, setSingleLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const getConfidenceColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'high': return 'green';
      case 'medium': return 'orange';
      case 'low': return 'red';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  const mapSingleDiagnosis = async () => {
    if (!singleDiagnosis.trim()) return;

    try {
      setSingleLoading(true);
      const response = await axios.post<DiagnosisMapping>('/api/map', {
        diagnosis: singleDiagnosis.trim()
      });
      setSingleResult(response.data);
    } catch (error: any) {
      console.error('Mapping failed:', error);
    } finally {
      setSingleLoading(false);
    }
  };

  const mapBatchDiagnoses = async () => {
    const validDiagnoses = batchDiagnoses.filter(d => d.trim());
    if (validDiagnoses.length === 0) return;

    try {
      setBatchLoading(true);
      const response = await axios.post<BatchMappingResponse>('/api/map/batch', {
        diagnoses: validDiagnoses
      });
      setBatchResults(response.data.results);
    } catch (error: any) {
      console.error('Batch mapping failed:', error);
    } finally {
      setBatchLoading(false);
    }
  };

  const addBatchInput = () => {
    setBatchDiagnoses([...batchDiagnoses, '']);
  };

  const removeBatchInput = (index: number) => {
    setBatchDiagnoses(batchDiagnoses.filter((_, i) => i !== index));
  };

  const updateBatchInput = (index: number, value: string) => {
    const updated = [...batchDiagnoses];
    updated[index] = value;
    setBatchDiagnoses(updated);
  };

  const renderResult = (result: DiagnosisMapping, index?: number) => (
    <Card size="small" style={{ marginTop: '16px' }} key={index}>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Paragraph>
            <Text strong>Original Diagnosis:</Text><br/>
            <Text>{result.original_diagnosis}</Text>
          </Paragraph>
          <Paragraph>
            <Text strong>Matched ICD Code:</Text><br/>
            <Text code style={{ fontSize: '16px', color: '#1890ff' }}>
              {result.matched_icd_code || 'No match'}
            </Text>
          </Paragraph>
        </Col>
        <Col xs={24} md={12}>
          <Paragraph>
            <Text strong>Description:</Text><br/>
            <Text>{result.matched_description || 'No description available'}</Text>
          </Paragraph>
          <Paragraph>
            <Text strong>Confidence:</Text><br/>
            <Tag color={getConfidenceColor(result.confidence_level)}>
              {result.confidence_level}
            </Tag>
          </Paragraph>
        </Col>
      </Row>
      <Divider style={{ margin: '12px 0' }} />
      <Paragraph>
        <Text strong>Justification:</Text><br/>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {result.justification}
        </Text>
      </Paragraph>
      {result.alternative_codes && (
        <Paragraph>
          <Text strong>Alternatives:</Text><br/>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {result.alternative_codes}
          </Text>
        </Paragraph>
      )}
    </Card>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={1} style={{ textAlign: 'center', marginBottom: '32px' }}>
        <MedicineBoxOutlined /> ICD-10 Diagnosis Mapper
      </Title>

      <Row gutter={[24, 24]}>
        {/* Single Diagnosis Mapping */}
        <Col xs={24} lg={12}>
          <Card title="Single Diagnosis Mapping">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="Enter diagnosis (e.g., diabetes mellitus)"
                value={singleDiagnosis}
                onChange={(e) => setSingleDiagnosis(e.target.value)}
                onPressEnter={mapSingleDiagnosis}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={mapSingleDiagnosis}
                loading={singleLoading}
                disabled={!singleDiagnosis.trim()}
                style={{ width: '100%' }}
              >
                Map to ICD-10 Code
              </Button>

              {singleResult && renderResult(singleResult)}
            </Space>
          </Card>
        </Col>

        {/* Batch Diagnosis Mapping */}
        <Col xs={24} lg={12}>
          <Card title="Batch Diagnosis Mapping">
            <Space direction="vertical" style={{ width: '100%' }}>
              {batchDiagnoses.map((diagnosis, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px' }}>
                  <Input
                    placeholder={`Diagnosis ${index + 1}`}
                    value={diagnosis}
                    onChange={(e) => updateBatchInput(index, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {batchDiagnoses.length > 1 && (
                    <Button
                      icon={<DeleteOutlined />}
                      onClick={() => removeBatchInput(index)}
                      danger
                    />
                  )}
                </div>
              ))}

              <Space>
                <Button
                  icon={<PlusOutlined />}
                  onClick={addBatchInput}
                  disabled={batchDiagnoses.length >= 10}
                >
                  Add Diagnosis
                </Button>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={mapBatchDiagnoses}
                  loading={batchLoading}
                  disabled={batchDiagnoses.filter(d => d.trim()).length === 0}
                >
                  Map All ({batchDiagnoses.filter(d => d.trim()).length})
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Batch Results */}
      {batchResults.length > 0 && (
        <Card title={`Batch Results (${batchResults.length})`} style={{ marginTop: '24px' }}>
          <List
            dataSource={batchResults}
            renderItem={(item, index) => (
              <List.Item key={index}>
                {renderResult(item, index)}
              </List.Item>
            )}
            pagination={{
              pageSize: 5,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
          />
        </Card>
      )}

      <Alert
        message="Usage Instructions"
        description="Enter medical diagnoses in natural language. The system uses hybrid keyword matching and semantic search to find the most appropriate ICD-10 codes."
        type="info"
        style={{ marginTop: '24px' }}
        showIcon
      />
    </div>
  );
};

export default DiagnosisMapper;