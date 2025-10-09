import React, { useState } from 'react';
import { Button, Upload, message, Typography, Card, Space, Row, Col, Image, Divider } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

const CompanyLogo = () => {
  const [logoFileList, setLogoFileList] = useState([]);
  const [logoLoading, setLogoLoading] = useState(false);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(null);

  const [signatureFileList, setSignatureFileList] = useState([]);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [companySignatureUrl, setCompanySignatureUrl] = useState(null);

  const handleCustomUpload = async ({ file, onSuccess, onError, type }) => {
    const setLoadingState = type === 'logo' ? setLogoLoading : setSignatureLoading;
    const setFileListState = type === 'logo' ? setLogoFileList : setSignatureFileList;
    const setImageUrlState = type === 'logo' ? setCompanyLogoUrl : setCompanySignatureUrl;

    setLoadingState(true);
    const formData = new FormData();
    formData.append(type === 'logo' ? 'logoFile' : 'signatureFile', file);

    try {
      const uploadUrl = type === 'logo' ? '/api/upload-company-logo' : '/api/upload-company-signature';
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        message.success(`${file.name} ${type} uploaded successfully.`);
        onSuccess(data, file);
        const imageUrl = data.url || URL.createObjectURL(file);
        setFileListState([{ uid: data.id || file.uid, name: file.name, status: 'done', url: imageUrl }]);
        setImageUrlState(imageUrl);
      } else {
        const errorData = await response.json();
        message.error(`${file.name} ${type} upload failed: ${errorData.message || 'Server error'}`);
        onError(errorData);
      }
    } catch (error) {
      console.error(`Upload ${type} error:`, error);
      message.error(`${file.name} ${type} upload failed: ${error.message}`);
      onError(error);
    } finally {
      setLoadingState(false);
    }
  };

  const handleRemove = async (file, type) => {
    const setLoadingState = type === 'logo' ? setLogoLoading : setSignatureLoading;
    const setFileListState = type === 'logo' ? setLogoFileList : setSignatureFileList;
    const setImageUrlState = type === 'logo' ? setCompanyLogoUrl : setCompanySignatureUrl;

    setLoadingState(true);
    try {
      const deleteUrl = type === 'logo' ? `/api/delete-company-logo/${file.uid}` : `/api/delete-company-signature/${file.uid}`;
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success(`${file.name} ${type} removed successfully.`);
        setFileListState([]);
        setImageUrlState(null);
      } else {
        const errorData = await response.json();
        message.error(`${file.name} ${type} removal failed: ${errorData.message || 'Server error'}`);
      }
    } catch (error) {
      console.error(`Removal ${type} error:`, error);
      message.error(`${file.name} ${type} removal failed: ${error.message}`);
    } finally {
      setLoadingState(false);
    }
    return true;
  };

  const logoUploadProps = {
    name: 'logoFile',
    multiple: false,
    listType: 'picture',
    maxCount: 1,
    accept: 'image/*',
    fileList: logoFileList,
    customRequest: (options) => handleCustomUpload({ ...options, type: 'logo' }),
    onChange(info) {
      let newFileList = [...info.fileList];
      newFileList = newFileList.slice(-1);
      if (info.file.status === 'done') {
        message.success(`${info.file.name} logo uploaded successfully.`);
        if (info.file.originFileObj) {
          setCompanyLogoUrl(URL.createObjectURL(info.file.originFileObj));
        } else if (info.file.url) {
          setCompanyLogoUrl(info.file.url);
        }
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} logo upload failed.`);
      } else if (info.file.status === 'removed') {
        setCompanyLogoUrl(null);
      }
      setLogoFileList(newFileList);
    },
    onRemove: (file) => handleRemove(file, 'logo'),
  };

  const signatureUploadProps = {
    name: 'signatureFile',
    multiple: false,
    listType: 'picture',
    maxCount: 1,
    accept: 'image/*',
    fileList: signatureFileList,
    customRequest: (options) => handleCustomUpload({ ...options, type: 'signature' }),
    onChange(info) {
      let newFileList = [...info.fileList];
      newFileList = newFileList.slice(-1);
      if (info.file.status === 'done') {
        message.success(`${info.file.name} signature uploaded successfully.`);
        if (info.file.originFileObj) {
          setCompanySignatureUrl(URL.createObjectURL(info.file.originFileObj));
        } else if (info.file.url) {
          setCompanySignatureUrl(info.file.url);
        }
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} signature upload failed.`);
      } else if (info.file.status === 'removed') {
        setCompanySignatureUrl(null);
      }
      setSignatureFileList(newFileList);
    },
    onRemove: (file) => handleRemove(file, 'signature'),
  };

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Company Logo & Signature Settings</Title>}
      style={{ margin: 'auto', padding: '16px' }}
      bodyStyle={{ padding: '30px' }}
    >
      <Paragraph style={{ marginBottom: 24 }}>Manage your company logo and authorized signature images.</Paragraph>

      <Row gutter={[32, 32]} justify="space-around">
        <Col xs={24} md={11}>
          <Title level={5}>Company Logo</Title>
          <Paragraph type="secondary" style={{ marginBottom: 20 }}>Upload your official company logo.</Paragraph>
          <Row gutter={16} align="middle">
            <Col span={companyLogoUrl ? 12 : 24}>
              <Dragger {...logoUploadProps} disabled={logoLoading}>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">Click or drag logo to this area</p>
                <p className="ant-upload-hint">
                  Support for single image upload. Max size: 2MB. Recommended: PNG.
                </p>
              </Dragger>
            </Col>
            {companyLogoUrl && (
              <Col span={12} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div>
                  <Title level={5} style={{ marginBottom: 10, textAlign: 'center' }}>Current Logo:</Title>
                  <Image
                    width={150}
                    src={companyLogoUrl}
                    alt="Company Logo Preview"
                    style={{ border: '1px solid #f0f0f0', padding: 5, borderRadius: '4px' }}
                  />
                </div>
              </Col>
            )}
          </Row>
        </Col>

        <Col xs={0} md={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Divider type="vertical" style={{ height: '80%' }} />
        </Col>

        <Col xs={24} md={11}>
          <Title level={5}>Company Signature</Title>
          <Paragraph type="secondary" style={{ marginBottom: 20 }}>Upload an authorized company signature image.</Paragraph>
          <Row gutter={16} align="middle">
            <Col span={companySignatureUrl ? 12 : 24}>
              <Dragger {...signatureUploadProps} disabled={signatureLoading}>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">Click or drag signature to this area</p>
                <p className="ant-upload-hint">
                  Support for single image upload. Max size: 1MB. Recommended: Transparent PNG.
                </p>
              </Dragger>
            </Col>
            {companySignatureUrl && (
              <Col span={12} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div>
                  <Title level={5} style={{ marginBottom: 10, textAlign: 'center' }}>Current Signature:</Title>
                  <Image
                    width={150}
                    src={companySignatureUrl}
                    alt="Company Signature Preview"
                    style={{ border: '1px solid #f0f0f0', padding: 5, borderRadius: '4px' }}
                  />
                </div>
              </Col>
            )}
          </Row>
        </Col>
      </Row>

      <Button
        type="primary"
        onClick={() => {
          message.info('Saving all image settings...');
        }}
        style={{backgroundColor: '#0E2B43', borderColor: '#orange', color: 'white' , marginTop: 30, display: 'block', margin: '30px auto 0' }}
        disabled={logoLoading || signatureLoading}
      >
        Save All Images
      </Button>
    </Card>
  );
};

export default CompanyLogo;