'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { generateRingRef, getImageUrl, ringStoneDefaults } from '../utils/helpers';

const allStones = ["Amatista", "Zafiro", "Aguamarina", "Peridoto", "Prehennite", "Granate", "Blanco", "Naranja"];

const AdminPage = () => {
  const [tab, setTab] = useState('Inventario');
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchInventory();
    fetchOrders();
  }, []);

  const fetchInventory = async () => {
    const { data, error } = await supabase.from('inventory').select('*');
    if (!error) setInventory(data);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*');
    if (!error) setOrders(data);
  };

  const updateInventoryItem = async (updates) => {
    const { error } = await supabase.from('inventory').update(updates).eq('id', selectedItem.id);
    if (!error) {
      fetchInventory();
      setSelectedItem(null);
    }
  };

  const deleteItem = async () => {
    const table = modalType === 'Inventario' ? 'inventory' : 'orders';
    const { error } = await supabase.from(table).delete().eq('id', selectedItem.id);
    if (!error) {
      modalType === 'Inventario' ? fetchInventory() : fetchOrders();
      setSelectedItem(null);
    }
  };

  const handleRowClick = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
  };

  const handleModalChange = (e) => {
    setSelectedItem({ ...selectedItem, [e.target.name]: e.target.value });
  };
  
  const handleAddClick = () => {
    const isOrder = tab === 'Pedidos';
    setSelectedItem({
      ring_model: '',
      ring_size: '',
      ring_coating: '',
      ring_stone: '',
      customer_ref: isOrder ? '' : undefined,
      status: isOrder ? 'Pendiente' : undefined,
      stage: isOrder ? 'Taller' : undefined,
      order_date: isOrder ? new Date().toISOString().split('T')[0] : undefined
    });
    setModalType(tab);
    setIsAdding(true);
  };

  const filteredInventory = inventory.filter(item =>
    item.ring_model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.ring_coating?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.ring_stone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(order =>
    order.ring_model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.ring_coating?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.ring_stone?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const updateOrderItem = async (updates) => {
    const today = new Date(updates.order_date || new Date()).toISOString().split('T')[0];
  
    // Recalculate ring_ref and image_url
    const sameDayOrders = orders.filter(o => new Date(o.order_date).toDateString() === new Date(today).toDateString());
    updates.ring_ref = generateRingRef(updates.ring_model, today, sameDayOrders.length);
    updates.image_url = getImageUrl(updates.ring_model);
  
    const { error } = await supabase.from('orders').update(updates).eq('id', selectedItem.id);
    if (!error) {
      fetchOrders();
      setSelectedItem(null);
    }
  };
  
  const handleStoneChange = (index, value) => {
    const stones = selectedItem.ring_stone?.split(" & ") || [];
    stones[index] = value;
    const updatedStones = stones.filter(s => s).join(" & ");
    setSelectedItem({ ...selectedItem, ring_stone: updatedStones });
  };
    
  const addOrderItem = async (newItem) => {
    const orderDate = newItem.order_date || new Date().toISOString().split('T')[0];
    const sameDayOrders = orders.filter(o =>
      new Date(o.order_date).toDateString() === new Date(orderDate).toDateString()
    );
  
    newItem.ring_ref = generateRingRef(newItem.ring_model, orderDate, sameDayOrders.length);
    newItem.image_url = getImageUrl(newItem.ring_model);
  
    // If ring_stone is undefined, assemble it from defaults
    const count = ringStoneDefaults[newItem.ring_model]?.count || 0;
    const coating = newItem.ring_coating?.toLowerCase();
    const defaults = ringStoneDefaults[newItem.ring_model]?.[coating] || [];
    const currentStones = newItem.ring_stone?.split(" & ") || [];
  
    const finalStones = [];
    if (count >= 1) finalStones.push(currentStones[0] || defaults[0]);
    if (count >= 2) finalStones.push(currentStones[1] || defaults[1]);
  
    newItem.ring_stone = finalStones.join(" & ");
  
    const { error } = await supabase.from('orders').insert([newItem]);
    if (!error) {
      fetchOrders();
      setSelectedItem(null);
    }
  };
  
  const addInventoryItem = async (newItem) => {

    // If ring_stone is undefined, assemble it from defaults
    const count = ringStoneDefaults[newItem.ring_model]?.count || 0;
    const coating = newItem.ring_coating?.toLowerCase();
    const defaults = ringStoneDefaults[newItem.ring_model]?.[coating] || [];
    const currentStones = newItem.ring_stone?.split(" & ") || [];
  
    const finalStones = [];
    if (count >= 1) finalStones.push(currentStones[0] || defaults[0]);
    if (count >= 2) finalStones.push(currentStones[1] || defaults[1]);
  
    newItem.ring_stone = finalStones.join(" & ");
    
    const cleanedItem = {
      ring_model: newItem.ring_model,
      ring_size: newItem.ring_size,
      ring_coating: newItem.ring_coating,
      ring_stone: newItem.ring_stone
    };
  
    const { error } = await supabase.from('inventory').insert([cleanedItem]);
    if (!error) {
      fetchInventory();
      setSelectedItem(null);
    } else {
      console.error('Error inserting item:', error.message);
      alert('Error inserting item: ' + error.message);
    }
  };
  
  const stoneCount = ringStoneDefaults[selectedItem?.ring_model]?.count || 0;
  const coating = selectedItem?.ring_coating?.toLowerCase();
  const defaults = ringStoneDefaults[selectedItem?.ring_model]?.[coating] || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
        <img
          src="https://yuxyqhdkerbpjrpbeynf.supabase.co/storage/v1/object/public/ring-images//aire-logo-transparent.png"
          alt="Aire Logo"
          style={{ height: '80px', objectFit: 'contain' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '20px' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            backgroundColor: '#f3f4f6',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ⬅ Volver
        </button>
        <input
          type="text"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '0.9rem',
            width: '240px'
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px 0' }}>
        <button onClick={handleAddClick} style={{ fontSize: '20px', border: '1px solid #ccc', borderRadius: '8px',backgroundColor: 'white', padding: '8px 16px' }}>
          ➕
        </button>
        {['Inventario', 'Pedidos'].map(name => (
          <button
            key={name}
            onClick={() => setTab(name)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: tab === name ? '2px solid #10b981' : '1px solid #ccc',
              backgroundColor: tab === name ? '#ecfdf5' : 'white',
              fontWeight: tab === name ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            {name}
          </button>
        ))}
      </div>
      
      {/* Table Section */}
      <div style={{ overflowX: 'auto', margin: '0 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', color: '#111827' }}>
              {(tab === 'Inventario'
                ? ['Modelo', 'Talla', 'Acabado', 'Piedras']
                : ['Modelo', 'Talla', 'Acabado', 'Piedras', 'Fecha', '# Shopify', 'Estado', 'Etapa']
              ).map(label => (
                <th key={label} style={{ padding: '12px 16px', fontWeight: '600' }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(tab === 'Inventario' ? filteredInventory : filteredOrders).map(item => (
              <tr
                key={item.id}
                onClick={() => handleRowClick(item, tab)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease-in-out',
                  marginBottom: '10px'
                }}
              >
                <td style={{ textAlign: 'center',padding: '12px 16px' }}>{item.ring_model}</td>
                <td style={{ textAlign: 'center',padding: '12px 16px' }}>{item.ring_size}</td>
                <td style={{ textAlign: 'center',padding: '12px 16px' }}>{item.ring_coating}</td>
                <td style={{ textAlign: 'center',padding: '12px 16px' }}>{item.ring_stone}</td>
                {tab === 'Pedidos' && (
                  <>
                    <td style={{ textAlign: 'center',padding: '12px 16px' }}>{new Date(item.order_date).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'center',padding: '12px 16px' }}>{item.customer_ref}</td>
                    <td style={{ textAlign: 'center',padding: '12px 16px' }}>{item.status}</td>
                    <td style={{ textAlign: 'center',padding: '12px 16px' }}>{item.stage}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <div style={{
          position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
          background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', zIndex: 1000,
          width: '360px'
        }}>
          <h3>{isAdding ? 'Añadir' : 'Editar'} {modalType === 'Inventario' ? 'Inventario' : 'Pedido'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select name="ring_model" value={selectedItem.ring_model} onChange={handleModalChange}>
              <option value="">Modelo</option>
              {Object.keys(ringStoneDefaults).map(model => <option key={model} value={model}>{model}</option>)}
            </select>

            <select name="ring_size" value={selectedItem.ring_size} onChange={handleModalChange}>
              <option value="">Talla</option>
              {[...Array(20)].map((_, i) => {
                const size = i + 5;
                return <option key={size} value={size}>{size}</option>;
              })}
            </select>

            <select name="ring_coating" value={selectedItem.ring_coating} onChange={handleModalChange}>
              <option value="">Acabado</option>
              <option value="Oro">Oro</option>
              <option value="Plata">Plata</option>
            </select>

            {[...Array(stoneCount)].map((_, i) => (
              <select key={i} value={selectedItem.ring_stone?.split(" & ")[i] || defaults[i]} onChange={e => handleStoneChange(i, e.target.value)}>
                <option value="">Piedra {i + 1}</option>
                {allStones.map(stone => <option key={stone} value={stone}>{stone}</option>)}
              </select>
            ))}
      
            {modalType === 'Pedidos' && (
              <>
                <input name="customer_ref" value={selectedItem.customer_ref || ''} onChange={handleModalChange} placeholder="Referencia Shopify" />
      
                <select name="status" value={selectedItem.status} onChange={handleModalChange}>
                  <option value="">Estado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aceptado">Aceptado</option>
                  <option value="ListoParaTraslado">Listo para traslado</option>
                  <option value="EnTransito">En tránsito</option>
                  <option value="Recibido">Recibido</option>
                  <option value="EnCola">En cola</option>
                  <option value="ListoParaEntrega">Listo para entrega</option>
                  <option value="TransitoFinal">En tránsito final</option>
                  <option value="Completado">Completado</option>
                </select>
      
                <select name="stage" value={selectedItem.stage} onChange={handleModalChange}>
                  <option value="">Etapa</option>
                  <option value="Taller">Taller</option>
                  <option value="Traslado">Traslado</option>
                  <option value="Embalaje">Embalaje</option>
                  <option value="Envío">Envío</option>
                </select>
                
                <input
                  type="date"
                  name="order_date"
                  value={selectedItem.order_date?.split('T')[0] || ''}
                  onChange={handleModalChange}
                  placeholder="Fecha del pedido"
                />
              </>
            )}
      
            <button
              onClick={() => {
                if (isAdding) {
                  if (modalType === 'Inventario') {
                    addInventoryItem(selectedItem);
                  } else {
                    addOrderItem(selectedItem);
                  }
                } else {
                  if (modalType === 'Inventario') {
                    updateInventoryItem(selectedItem);
                  } else {
                    updateOrderItem(selectedItem);
                  }
                }
                setIsAdding(false); // ✅ reset after operation
              }}
              style={{ backgroundColor: '#10b981', color: 'white', padding: '10px', borderRadius: '8px' }}
            >
              Guardar cambios
            </button>
            
            {!isAdding && (
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
                    if (modalType === 'Inventario') {
                      supabase.from('inventory').delete().eq('id', selectedItem.id).then(fetchInventory);
                    } else {
                      supabase.from('orders').delete().eq('id', selectedItem.id).then(fetchOrders);
                    }
                    setSelectedItem(null);
                  }
                }}
                style={{ backgroundColor: '#ef4444', color: 'white', padding: '10px', borderRadius: '8px' }}
              >
                🗑 Eliminar
              </button>
            )}
      
            <button onClick={() => { setSelectedItem(null); setIsAdding(false); }} style={{ color: 'gray' }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;