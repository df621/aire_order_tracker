'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

const STAGES_ALL = ['➕', 'Ver Todo', 'Taller', 'Traslado', 'Embalaje', 'Envío'];

const STAGES_BY_ROLE = {
  Admin: STAGES_ALL,
  Manager: ['Ver Todo', 'Taller', 'Traslado', 'Embalaje', 'Envío'],
  Jeweller: ['Taller', 'Traslado'],
};

const ringImageUrls = {
  "Boreas": "https://yuxyqhdkerbpjrpbeynf.supabase.co/storage/v1/object/public/ring-images/Boreas.png",
  "Galerno": "https://yuxyqhdkerbpjrpbeynf.supabase.co/storage/v1/object/public/ring-images/Galerno.png",
  "Plasma": "https://yuxyqhdkerbpjrpbeynf.supabase.co/storage/v1/object/public/ring-images/Plasma.png",
  "Ecos": "https://yuxyqhdkerbpjrpbeynf.supabase.co/storage/v1/object/public/ring-images/Ecos.png"
};

const ringStoneDefaults = {
  "Galerno": { count: 1, oro: ["Amatista"], plata: ["Amatista"] },
  "Boreas": { count: 2, oro: ["Zafiro", "Aguamarina"], plata: ["Zafiro", "Aguamarina"] },
  "Plasma": { count: 1, oro: ["Peridoto"], plata: ["Zafiro"] },
  "Ecos": { count: 0 } // no stones
};

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [activeStage, setActiveStage] = useState('Taller');
  const [searchQuery, setSearchQuery] = useState('');
  const [role, setRole] = useState('');
  const router = useRouter();
  const [lastAction, setLastAction] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [formData, setFormData] = useState({
    ring_name: '-',
    ring_size: '-',
    customer_ref: '',
    order_date: new Date().toISOString().split('T')[0],
    stage: 'Taller',
    status: 'Pendiente',
    ring_coating: '-',
    ring_stone_1: '',
    ring_stone_2: ''
  });
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // or redirect if using routing
  };

  useEffect(() => {
    fetchOrders();
  }, []);
  
  useEffect(() => {
    const fetchUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error(error);
        router.push('/login');
      } else {
        setRole(data.role);
      }
    };

    fetchUserAndRole();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('order_date', { ascending: true });

    if (!error) {
      setOrders(data || []);
    } else {
      console.error('❌ Error en Supabase:', error.message);
    }
  };

  const updateOrder = async (id, updates) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
  
    setLastAction({
      id,
      previousStatus: order.status,
      previousStage: order.stage
    });
  
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id);
    if (!error) fetchOrders();
  };
  
  const undoLastAction = async () => {
    if (!lastAction) return;
    const { id, previousStatus, previousStage } = lastAction;
  
    const { error } = await supabase
      .from('orders')
      .update({ status: previousStatus, stage: previousStage })
      .eq('id', id);
  
    if (!error) {
      fetchOrders();
      setLastAction(null); // Clear after undo
    }
  };

  const getUrgencyClass = (date) => {
    const days = (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);
    if (days > 4) return 'date-badge red';
    if (days > 2) return 'date-badge yellow';
    return 'date-badge green';
  };

  const addOrder = async () => {
    if (formData.ring_name === '-' || formData.ring_size === '-' || !formData.customer_ref) return;

    const today = new Date(formData.order_date);
    const ddmm = ("0" + today.getDate()).slice(-2) + ("0" + (today.getMonth() + 1)).slice(-2);

    const todaysOrders = orders.filter(order =>
      new Date(order.order_date).toDateString() === today.toDateString()
    ).length;

    const ring_ref = formData.ring_name.slice(0,3).toUpperCase() + ddmm + ("0" + (todaysOrders + 1)).slice(-2);
    const image_url = ringImageUrls[formData.ring_name];
    
    const ring_model = formData.ring_name;
    const ring_coating = formData.ring_coating;
    const defaults = ringStoneDefaults[ring_model]?.[ring_coating?.toLowerCase()] || [];
    const count = ringStoneDefaults[ring_model]?.count || 0;
    
    const stones = [];
    if (count >= 1) stones.push(formData.ring_stone_1 || defaults[0]);
    if (count >= 2) stones.push(formData.ring_stone_2 || defaults[1]);

    const ring_stone = stones.join(" & ");

    const newOrder = {
      ring_model: formData.ring_name, // Corrected key
      ring_size: formData.ring_size,
      customer_ref: formData.customer_ref,
      order_date: formData.order_date,
      stage: formData.stage,
      status: formData.status,
      ring_ref,
      image_url,
      ring_coating,
      ring_stone
    };

    const { error } = await supabase
      .from('orders')
      .insert([newOrder]);

    if (!error) {
      fetchOrders();
      setFormData({
        ring_name: '-',
        ring_size: '-',
        customer_ref: '',
        order_date: new Date().toISOString().split('T')[0],
        stage: 'Taller',
        status: 'Pendiente',
        ring_coating: '-',
        ring_stone_1: '',
        ring_stone_2: ''
      });
      setActiveStage('Ver Todo');
    }
    
  alert("🚀 Nuevo pedido añadido!")

  };
  
  const getStoneInputs = () => {
    const model = formData.ring_name;
    const coating = formData.ring_coating.toLowerCase();
    const config = ringStoneDefaults[model];
    if (!config || config.count === 0 || coating === '-') return null;

    const defaults = config[coating] || [];
    return (
      <div style={{ marginTop: '10px' }}>
        {[...Array(config.count)].map((_, i) => (
          <select
            key={i}
            value={formData[`ring_stone_${i + 1}`] || defaults[i]}
            onChange={e =>
              setFormData({ ...formData, [`ring_stone_${i + 1}`]: e.target.value })
            }
          >
            <option value="">Seleccione piedra</option>
            <option value="Amatista">Amatista</option>
            <option value="Zafiro">Zafiro</option>
            <option value="Aguamarina">Aguamarina</option>
            <option value="Peridoto">Peridoto</option>
            <option value="Ónix">Ónix</option>
            <option value="Rubí">Rubí</option>
          </select>
        ))}
      </div>
    );
  };

  const isFaded = (status) =>
    ['Aceptado', 'EnTransito', 'EnCola', 'TransitoFinal'].includes(status);

  const getActionButton = (order) => {
    if (role === 'Manager') return null; // ⛔️ Hide for managers
    const nextStageMap = {
      Pendiente: { status: 'Aceptado' },
      Aceptado: { stage: 'Traslado', status: 'ListoParaTraslado' },
      ListoParaTraslado: { status: 'EnTransito' },
      EnTransito: { stage: 'Embalaje', status: 'Recibido' },
      Recibido: { status: 'EnCola' },
      EnCola: { stage: 'Envío', status: 'ListoParaEntrega' },
      ListoParaEntrega: { status: 'TransitoFinal' },
      TransitoFinal: { status: 'Completado' }
    };

    const next = nextStageMap[order.status];
    if (!next) return null;
    
    const isJewellerRestricted = role === 'Jeweller' && !['Taller', 'Traslado'].includes(order.stage);
    if (isJewellerRestricted) return null;

    let label = 'Advance';
    switch (order.status) {
      case 'Pendiente': label = '✅ Aceptar Pedido'; break;
      case 'Aceptado': label = '🚚 Listo para Enviar'; break;
      case 'ListoParaTraslado': label = '📦 Enviar a Madrid'; break;
      case 'EnTransito': label = '📍 Recibido en Madrid'; break;
      case 'Recibido': label = '📦 Comenzar Embalaje'; break;
      case 'EnCola': label = '📮 Marcar como Listo'; break;
      case 'ListoParaEntrega': label = '✅ Marcar como Enviado'; break;
      case 'TransitoFinal': label = '✅ Marcar como Recibido'; break;
    }

    return (
      <button
        style={{
          marginTop: '12px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          e.stopPropagation();
          updateOrder(order.id, next);
        }}
      >
        {label}
      </button>
    );
  };

  const filteredOrders = orders.filter(order => {
    if (activeStage !== 'Ver Todo' && order.stage !== activeStage && !(activeStage === 'Envío' && order.status === 'Completado')) {
      return false;
    }
    const query = searchQuery.toLowerCase();
    return (
      order.ring_model?.toLowerCase().includes(query) ||
      order.ring_ref?.toLowerCase().includes(query) ||
      order.customer_ref?.toLowerCase().includes(query) ||
      order.status?.toLowerCase().includes(query) ||
      order.stage?.toLowerCase().includes(query)
    );
  });
  
  if (!role) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando permisos del usuario...</div>;

  const visibleStages = STAGES_BY_ROLE[role] || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
        <img
          src="https://yuxyqhdkerbpjrpbeynf.supabase.co/storage/v1/object/public/ring-images//aire-logo-transparent.png"
          alt="Aire Logo"
          style={{ height: '80px', objectFit: 'contain' }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          padding: '0 20px',
          position: 'relative',
        }}
      >
        {/* Left Menu Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(prev => !prev)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              fontWeight: 'normal',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            ☰
          </button>
      
          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '120%',
                left: '0',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                zIndex: 999,
              }}
            >
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      
        {/* Right Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {lastAction && (
            <button
              onClick={undoLastAction}
              title="Deshacer último cambio"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                backgroundColor: '#fff',
                fontWeight: 'normal',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Deshacer
            </button>
          )}
      
          {activeStage === 'Ver Todo' && (
            <input
              type="text"
              placeholder="Buscar pedido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '0.9rem',
                width: '240px',
              }}
            />
          )}
        </div>
      </div>

      {activeStage === '➕' && (
        <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', maxWidth: '600px', margin: '0 auto' }}>
          <select value={formData.ring_name} onChange={e => setFormData({ ...formData, ring_name: e.target.value })}>
            <option value="-">Seleccione anillo</option>
            {Object.keys(ringImageUrls).map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          <select value={formData.ring_size} onChange={e => setFormData({ ...formData, ring_size: e.target.value })}>
            <option value="-">Seleccione talla</option>
            {[...Array(8)].map((_, i) => <option key={i + 5} value={i + 5}>{i + 5}</option>)}
          </select>

          <input type="text" placeholder="Referencia de Shopify" value={formData.customer_ref} onChange={e => setFormData({ ...formData, customer_ref: e.target.value })} />

          <input type="date" value={formData.order_date} onChange={e => setFormData({ ...formData, order_date: e.target.value })} />

          <select value={formData.ring_coating} onChange={e => setFormData({ ...formData, ring_coating: e.target.value })}>
            <option value="-">Seleccione acabado</option>
            <option value="Oro">Oro</option>
            <option value="Plata">Plata</option>
          </select>

          {getStoneInputs()}

          <button onClick={addOrder}>➕ Añadir Pedido</button>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
        {visibleStages.map(stage => (
          <button
            key={stage}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeStage === stage ? '2px solid #10b981' : '1px solid #ccc',
              backgroundColor: activeStage === stage ? '#ecfdf5' : 'white',
              cursor: 'pointer',
              fontWeight: activeStage === stage ? 'bold' : 'normal'
            }}
            onClick={() => setActiveStage(stage)}
          >
            {stage}
          </button>
        ))}
      </div>

      {filteredOrders.map(order => {
        const faded = isFaded(order.status);
        const isExpanded = expandedId === order.id;

        return (
          <div
            key={order.id}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: faded ? '#f3f4f6' : 'white',
              opacity: faded ? 0.6 : 1,
              borderRadius: '12px',
              marginBottom: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
              cursor: 'pointer'
            }}
            onClick={() => setExpandedId(prev => (prev === order.id ? null : order.id))}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
              <img
                src={order.image_url?.trim() || 'https://via.placeholder.com/96'}
                alt={order.ring_model}
                style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '12px' }}
              />
              <div>
                <div style={{ fontWeight: 'bold' }}>{order.ring_model} ({order.ring_coating})</div>
                <div>{order.ring_stone}</div>
                <div>Talla: {order.ring_size}</div>
                {isExpanded && (
                  <div style={{ marginTop: '10px' }}>
                    <div><strong>Referencia de Shopify:</strong> {order.customer_ref || 'N/A'}</div>
                    <div><strong>Referencia interna:</strong> {order.ring_ref || 'N/A'}</div>
                    <div><strong>ID del pedido:</strong> {order.id}</div>
                    <div><strong>Fecha del pedido:</strong> {new Date(order.order_date).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>

            {isExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}>
                  {order.stage}
                </div>
                <div style={{
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}>
                  {order.status}
                </div>
                {getActionButton(order)}
              </div>
            )}

            <div className={getUrgencyClass(order.order_date)} style={{
              marginLeft: '16px',
              alignSelf: 'center',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              {new Date(order.order_date).toLocaleDateString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
