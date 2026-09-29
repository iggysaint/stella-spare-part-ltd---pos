/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserSession, Sale } from './types';
import { authService } from './services/authService';
import { receiptService } from './services/receiptService';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { LoginScreen } from './components/auth/LoginScreen';
import { PosScreen } from './components/pos/PosScreen';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { ProductsScreen } from './components/products/ProductsScreen';
import { CustomersScreen } from './components/customers/CustomersScreen';
import { SalesHistoryScreen } from './components/sales/SalesHistoryScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { ThermalReceipt } from './components/common/ThermalReceipt';

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSaleId, setSelectedSaleId] = useState<string | undefined>(undefined);
  const [currentPrintSale, setCurrentPrintSale] = useState<Sale | null>(null);
  const [openAddProductModal, setOpenAddProductModal] = useState<boolean>(false);
  const [openAddCustomerModal, setOpenAddCustomerModal] = useState<boolean>(false);

  // Initialize session
  useEffect(() => {
    authService.getSession().then((session) => {
      if (session.isLoggedIn) {
        setUser(session);
      }
    });

    // Listen for receipt print events
    const handlePrintEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ sale: Sale }>;
      if (customEvent.detail?.sale) {
        setCurrentPrintSale(customEvent.detail.sale);
      }
    };

    window.addEventListener('stella:print-receipt', handlePrintEvent);
    return () => {
      window.removeEventListener('stella:print-receipt', handlePrintEvent);
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  const handleLoginSuccess = (loggedInUser: UserSession) => {
    setUser(loggedInUser);
    setActiveTab('dashboard');
  };

  const handleNavigate = (tab: string) => {
    setSelectedSaleId(undefined);
    setOpenAddProductModal(false);
    setOpenAddCustomerModal(false);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddProductFromDashboard = () => {
    setSelectedSaleId(undefined);
    setOpenAddCustomerModal(false);
    setOpenAddProductModal(true);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddCustomerFromDashboard = () => {
    setSelectedSaleId(undefined);
    setOpenAddProductModal(false);
    setOpenAddCustomerModal(true);
    setActiveTab('customers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not authenticated, show two-account counter login
  if (!user || !user.isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col text-primary pb-20 lg:pb-8">
      {/* Top Navigation Header */}
      <Header
        currentTab={activeTab}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content View */}
      <main className="flex-1 w-full">
        {activeTab === 'dashboard' && (
          <DashboardScreen
            onNavigate={handleNavigate}
            onOpenAddProduct={handleOpenAddProductFromDashboard}
            onOpenAddCustomer={handleOpenAddCustomerFromDashboard}
            user={user}
          />
        )}

        {activeTab === 'pos' && (
          <PosScreen
            onViewSaleHistory={(saleId) => {
              setSelectedSaleId(saleId);
              setActiveTab('sales');
            }}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'products' && (
          <ProductsScreen initialOpenAddModal={openAddProductModal} />
        )}

        {activeTab === 'customers' && (
          <CustomersScreen initialOpenAddCustomer={openAddCustomerModal} />
        )}

        {activeTab === 'credit' && (
          <CustomersScreen />
        )}

        {activeTab === 'sales' && (
          <SalesHistoryScreen 
            initialSaleId={selectedSaleId} 
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'reports' && <ReportsScreen />}

        {activeTab === 'settings' && (
          <SettingsScreen
            onLogout={handleLogout}
            user={user}
          />
        )}
      </main>

      {/* Mobile/Tablet Bottom Navigation Bar */}
      <BottomNav currentTab={activeTab} onNavigate={handleNavigate} />

      {/* Hidden Thermal Receipt Print Element for Browser Print */}
      {currentPrintSale && (
        <div className="print-only hidden">
          <ThermalReceipt receipt={receiptService.formatReceipt(currentPrintSale)} />
        </div>
      )}
    </div>
  );
}
