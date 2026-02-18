/**
 * RPM Devices Page
 * List and manage IoT devices for remote patient monitoring
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SearchInput,
  FilterDropdown,
} from '@/components/healthcare';
import {
  Smartphone,
  Plus,
  Wifi,
  WifiOff,
  Battery,
  User,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Wrench,
  RefreshCw,
} from 'lucide-react';

const DEVICE_TYPES = [
  { value: 'blood_pressure_monitor', label: 'Blood Pressure Monitor' },
  { value: 'glucometer', label: 'Glucometer' },
  { value: 'pulse_oximeter', label: 'Pulse Oximeter' },
  { value: 'weight_scale', label: 'Weight Scale' },
  { value: 'thermometer', label: 'Thermometer' },
  { value: 'ecg_monitor', label: 'ECG Monitor' },
  { value: 'spirometer', label: 'Spirometer' },
  { value: 'activity_tracker', label: 'Activity Tracker' },
  { value: 'continuous_glucose_monitor', label: 'CGM' },
  { value: 'heart_rate_monitor', label: 'Heart Rate Monitor' },
  { value: 'peak_flow_meter', label: 'Peak Flow Meter' },
];

const DEVICE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'lost', label: 'Lost' },
  { value: 'retired', label: 'Retired' },
  { value: 'pending_activation', label: 'Pending Activation' },
];

export function RpmDevicesPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [status, setStatus] = useState('');
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [page, setPage] = useState(1);
  const [actionDevice, setActionDevice] = useState<any>(null);

  // Fetch devices
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rpm', 'devices', { search, deviceType, status, showUnassigned, page }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (deviceType) params.set('deviceType', deviceType);
      if (status) params.set('status', status);
      if (showUnassigned) params.set('unassigned', 'true');
      return api.get(`/rpm/devices?${params.toString()}`);
    },
  });

  // Delete device mutation
  const deleteMutation = useMutation({
    mutationFn: (deviceId: string) => api.delete(`/rpm/devices/${deviceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpm', 'devices'] });
      setActionDevice(null);
    },
  });

  // Set maintenance mutation
  const maintenanceMutation = useMutation({
    mutationFn: ({ deviceId, reason }: { deviceId: string; reason: string }) =>
      api.post(`/rpm/devices/${deviceId}/maintenance`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpm', 'devices'] });
    },
  });

  const devices = data?.data || [];
  const pagination = data?.pagination;

  const columns = [
    {
      key: 'device',
      header: 'Device',
      render: (device: any) => (
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              device.isOnline ? 'bg-green-100' : 'bg-gray-100'
            }`}
          >
            <Smartphone
              className={`h-5 w-5 ${device.isOnline ? 'text-green-600' : 'text-gray-400'}`}
            />
          </div>
          <div>
            <Link
              to={`/rpm/devices/${device.id}`}
              className="text-sm font-medium text-gray-900 hover:text-indigo-600"
            >
              {device.deviceNumber}
            </Link>
            <p className="text-xs text-gray-500">{device.serialNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (device: any) => (
        <span className="text-sm text-gray-700">
          {DEVICE_TYPES.find((t) => t.value === device.deviceType)?.label || device.deviceType}
        </span>
      ),
    },
    {
      key: 'manufacturer',
      header: 'Manufacturer',
      render: (device: any) => (
        <div>
          <span className="text-sm text-gray-900">{device.manufacturer}</span>
          <p className="text-xs text-gray-500">{device.model}</p>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Assigned To',
      render: (device: any) =>
        device.assignedPatientId ? (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-3 w-3 text-blue-600" />
            </div>
            <span className="text-sm text-gray-700">
              Patient #{device.assignedPatientId.slice(0, 8)}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Unassigned</span>
        ),
    },
    {
      key: 'connectivity',
      header: 'Status',
      render: (device: any) => (
        <div className="flex items-center gap-2">
          {device.isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-gray-400" />
          )}
          <StatusBadge
            status={device.status}
            statusMap={{
              active: { label: 'Active', variant: 'green' },
              inactive: { label: 'Inactive', variant: 'gray' },
              maintenance: { label: 'Maintenance', variant: 'yellow' },
              lost: { label: 'Lost', variant: 'red' },
              retired: { label: 'Retired', variant: 'gray' },
              pending_activation: { label: 'Pending', variant: 'blue' },
            }}
          />
        </div>
      ),
    },
    {
      key: 'battery',
      header: 'Battery',
      render: (device: any) =>
        device.batteryLevel !== null ? (
          <div className="flex items-center gap-2">
            <Battery
              className={`h-4 w-4 ${
                device.batteryLevel <= 20
                  ? 'text-red-500'
                  : device.batteryLevel <= 50
                  ? 'text-yellow-500'
                  : 'text-green-500'
              }`}
            />
            <span className="text-sm">{device.batteryLevel}%</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">N/A</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (device: any) => (
        <div className="relative">
          <button
            onClick={() => setActionDevice(actionDevice?.id === device.id ? null : device)}
            className="p-1 rounded hover:bg-gray-100"
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>

          {actionDevice?.id === device.id && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
              <Link
                to={`/rpm/devices/${device.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4" />
                Edit Device
              </Link>
              {device.assignedPatientId ? (
                <button
                  onClick={() => {
                    api.post(`/rpm/devices/${device.id}/unassign`).then(() => {
                      queryClient.invalidateQueries({ queryKey: ['rpm', 'devices'] });
                      setActionDevice(null);
                    });
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserMinus className="h-4 w-4" />
                  Unassign Patient
                </button>
              ) : (
                <Link
                  to={`/rpm/devices/${device.id}/assign`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign to Patient
                </Link>
              )}
              <button
                onClick={() => {
                  const reason = prompt('Enter maintenance reason:');
                  if (reason) {
                    maintenanceMutation.mutate({ deviceId: device.id, reason });
                    setActionDevice(null);
                  }
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Wrench className="h-4 w-4" />
                Set Maintenance
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to retire this device?')) {
                    deleteMutation.mutate(device.id);
                  }
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Retire Device
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="IoT Devices"
        subtitle="Manage connected medical devices for remote monitoring"
        icon={<Smartphone className="h-8 w-8 text-indigo-600" />}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link
              to="/rpm/devices/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Device
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by number, serial, manufacturer..."
            />
          </div>
          <FilterDropdown
            label="Device Type"
            value={deviceType}
            onChange={setDeviceType}
            options={[{ value: '', label: 'All Types' }, ...DEVICE_TYPES]}
          />
          <FilterDropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={[{ value: '', label: 'All Statuses' }, ...DEVICE_STATUSES]}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnassigned}
              onChange={(e) => setShowUnassigned(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Unassigned only</span>
          </label>
        </div>
      </div>

      {/* Devices Table */}
      <DataTable
        columns={columns}
        data={devices}
        isLoading={isLoading}
        emptyTitle="No devices found"
        rowKey={(device: any) => device.id}
        currentPage={pagination?.page}
        totalPages={pagination?.totalPages}
        totalItems={pagination?.total}
        onPageChange={setPage}
      />
    </div>
  );
}

export default RpmDevicesPage;
