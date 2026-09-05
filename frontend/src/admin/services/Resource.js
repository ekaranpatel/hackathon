import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../student/pages/Api';

const API_BASE_URL = BACKEND_URL;

const getAuthHeader = () => {
  const token = localStorage.getItem('labToken');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  };
};

export function useResources() {
  const [resources, setResources] = useState([]);
  const [labsList, setLabsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
console.log("resources", resources);
  const getErrMsg = (err) =>
    err.response?.data?.message || err.message || 'An unexpected error occurred.';

  // Fallback calculations on state level
  const syncAvailableQuantity = (res) => {
    const total = Number(res.totalQuantity) || 0;
    const totalAssigned = (res.assignedLabs || []).reduce((sum, item) => {
      const q = Number(
        item?.assignedQuantity !== undefined
          ? item.assignedQuantity
          : (item?.quantity !== undefined ? item.quantity : 0)
      );
      return sum + (isNaN(q) ? 0 : q);
    }, 0);
    return {
      ...res,
      availableQuantity: Math.max(0, total - totalAssigned)
    };
    console.log('totalQuantity', res.totalQuantity, 'totalAssigned', res.assignedLabs, 'availableQuantity', Math.max(0, total - totalAssigned));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resourceConfig = {
        ...getAuthHeader(),
        params: {
          search: search.trim() || undefined,
          category: category !== 'All' ? category : undefined
        }
      };

      const [resResponse, labsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/resources`, resourceConfig),
        axios.get(`${API_BASE_URL}/labs`, getAuthHeader())
      ]);

      const formattedResources = (resResponse.data || []).map(syncAvailableQuantity);
      setResources(formattedResources);
      setLabsList(labsResponse.data || []);
    } catch (err) {
      setError(getErrMsg(err));
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchData]);

  const addResource = async (formData) => {
    try {
      const { data: createdResource } = await axios.post(
        `${API_BASE_URL}/resources`,
        formData,
        getAuthHeader()
      );
      const computed = syncAvailableQuantity(createdResource);
      setResources((prev) => [...prev, computed]);
      return computed;
    } catch (err) {
      const msg = getErrMsg(err);
      alert(msg);
      throw new Error(msg);
    }
  };

  const updateResource = async (id, formData) => {
    try {
      const { data: updated } = await axios.put(
        `${API_BASE_URL}/resources/${id}`,
        formData,
        getAuthHeader()
      );
      const computed = syncAvailableQuantity(updated);
      setResources((prev) =>
        prev.map((r) => (String(r.id || r._id) === String(id) ? computed : r))
      );
      return computed;
    } catch (err) {
      const msg = getErrMsg(err);
      alert(msg);
      throw new Error(msg);
    }
  };

  const quickQuantityChange = async (target, delta) => {
    const resourceObj =
      typeof target === 'object'
        ? target
        : resources.find((r) => String(r._id || r.id) === String(target));
    if (!resourceObj) return;

    const resId = resourceObj._id || resourceObj.id;
    const currentTotal = Number(resourceObj.totalQuantity) || 0;
    const newTotal = currentTotal + delta;

    if (newTotal < 0) return;

    setResources((prev) =>
      prev.map((r) =>
        String(r.id || r._id) === String(resId)
          ? syncAvailableQuantity({ ...r, totalQuantity: newTotal })
          : r
      )
    );

    try {
      const { data: updated } = await axios.put(
        `${API_BASE_URL}/resources/${resId}`,
        { totalQuantity: newTotal },
        getAuthHeader()
      );
      const computed = syncAvailableQuantity(updated);
      setResources((prev) =>
        prev.map((r) => (String(r.id || r._id) === String(resId) ? computed : r))
      );
    } catch (err) {
      setResources((prev) =>
        prev.map((r) =>
          String(r.id || r._id) === String(resId)
            ? syncAvailableQuantity({ ...r, totalQuantity: currentTotal })
            : r
        )
      );
      const msg = getErrMsg(err);
      alert(msg);
    }
  };

  const deleteResource = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/resources/${id}`, getAuthHeader());
      setResources((prev) =>
        prev.filter((r) => String(r.id || r._id) !== String(id))
      );
    } catch (err) {
      const msg = getErrMsg(err);
      alert(msg);
      throw new Error(msg);
    }
  };

  const assignToLab = async (resourceId, labId, quantity) => {
    try {
      const { data: updatedResource } = await axios.post(
        `${API_BASE_URL}/resources/${resourceId}/assign`,
        {
          labId,
          assignedQuantity: Number(quantity),
          quantity: Number(quantity)
        },
        getAuthHeader()
      );

      const computed = syncAvailableQuantity(updatedResource);
      setResources((prev) =>
        prev.map((r) => (String(r.id || r._id) === String(resourceId) ? computed : r))
      );

      return computed;
    } catch (err) {
      const msg = getErrMsg(err);
      alert(msg);
      throw new Error(msg);
    }
  };

  const unassignLab = async (arg1, arg2) => {
    let targetResourceId;
    let targetLabId;

    if (typeof arg1 === 'object' && arg1 !== null) {
      targetResourceId = arg1.resourceId;
      targetLabId = arg1.labId;
    } else {
      targetResourceId = arg1;
      targetLabId = arg2;
    }

    if (!targetResourceId || !targetLabId) {
      console.error('Unassign failed: Missing resourceId or labId', {
        targetResourceId,
        targetLabId
      });
      return;
    }

    try {
      const { data: updatedResource } = await axios.delete(
        `${API_BASE_URL}/resources/${targetResourceId}/unassign/${targetLabId}`,
        getAuthHeader()
      );

      const computed = syncAvailableQuantity(updatedResource);
      setResources((prev) =>
        prev.map((r) =>
          String(r.id || r._id) === String(targetResourceId) ? computed : r
        )
      );
      return computed;
    } catch (err) {
      const msg = getErrMsg(err);
      alert(msg);
      throw new Error(msg);
    }
  };

  return {
    resources,
    labsList,
    loading,
    error,
    category,
    setCategory,
    search,
    setSearch,
    refreshData: fetchData,
    addResource,
    updateResource,
    quickQuantityChange,
    deleteResource,
    assignToLab,
    unassignLab
  };
}