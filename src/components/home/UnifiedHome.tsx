import React from 'react';
import { Outlet } from 'react-router-dom';

export default function UnifiedHome() {
  console.log('UnifiedHome rendering');
  return <Outlet />;
} 