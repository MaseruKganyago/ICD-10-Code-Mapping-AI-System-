'use client';

import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  MedicineBoxOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Header } = Layout;
const { Title } = Typography;

const Navigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Initialization',
    },
    {
      key: '/mapper',
      icon: <MedicineBoxOutlined />,
      label: 'Diagnosis Mapper',
    },
  ];

  return (
    <Header style={{
      display: 'flex',
      alignItems: 'center',
      background: '#fff',
      borderBottom: '1px solid #f0f0f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <Title level={4} style={{ margin: 0, marginRight: '32px' }}>
        ICD-10 API
      </Title>
      <Menu
        mode="horizontal"
        selectedKeys={[pathname]}
        items={menuItems}
        style={{ flex: 1, border: 'none' }}
        onClick={({ key }) => router.push(key)}
      />
    </Header>
  );
};

export default Navigation;