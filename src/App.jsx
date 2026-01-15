import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Heart, Search, Plus, Save, X, Activity, 
  Calendar, CheckCircle, Smile, Award, Phone, User, 
  PieChart as PieIcon, BarChart3, ListFilter, ChevronDown, Check,
  UserPlus, HeartHandshake, ArrowRight, AlertTriangle, Clock, CheckSquare, XSquare, Filter
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend 
} from 'recharts';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDVZ2KAUjlPFMcU4LhX5th24Ab4V7IXrxw",
  authDomain: "sociedad-socorro-app.firebaseapp.com",
  projectId: "sociedad-socorro-app",
  storageBucket: "sociedad-socorro-app.firebasestorage.app",
  messagingSenderId: "242574624064",
  appId: "1:242574624064:web:990addf2d4c8402911a6a5",
  measurementId: "G-8D40HXEL4D"
};

// Inicialización segura
let db;
try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } else {
    console.log("Modo Demo: Firebase no configurado aún.");
  }
} catch (e) {
  console.log("Error inicializando Firebase", e);
}

// --- UTILIDADES ---
const processTags = (data, field) => {
  const counts = {};
  data.forEach(item => {
    if (item[field]) {
      const tags = item[field].split(',').map(t => t.trim()); 
      tags.forEach(tag => {
        if(tag) {
            const cleanTag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
            counts[cleanTag] = (counts[cleanTag] || 0) + 1;
        }
      });
    }
  });
  return Object.keys(counts)
    .map(key => ({ name: key, value: counts[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
};

const processMentions = (data, field) => {
  const counts = {};
  data.forEach(item => {
    if (item[field]) {
      const names = item[field].split(',').map(n => n.trim());
      names.forEach(name => {
        if(name) counts[name] = (counts[name] || 0) + 1;
      });
    }
  });
  return Object.keys(counts)
    .map(key => ({ name: key, value: counts[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

// Calcula días restantes
const getDaysRemaining = (dateString) => {
  if (!dateString) return 999;
  const target = new Date(dateString + 'T00:00:00'); // Asegurar hora local
  const now = new Date();
  now.setHours(0,0,0,0);
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// --- COMPONENTES UI ---

const Badge = ({ children, color = "bg-blue-100 text-blue-800" }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
    {children}
  </span>
);

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
  >
    <div className={`p-3 rounded-full ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const InputGroup = ({ label, name, value, onChange, type = "text", placeholder = "", options = null }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
    {options ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
      >
        <option value="">Seleccionar...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : type === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none h-24 resize-none"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
      />
    )}
  </div>
);

const SisterSelect = ({ label, sistersList, currentSisterId, value, onChange, multiple = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  const selectedValues = multiple 
    ? (value ? value.split(',').map(s => s.trim()).filter(Boolean) : [])
    : (value ? [value] : []);

  const filteredOptions = sistersList
    .filter(s => s.id !== currentSisterId)
    .filter(s => {
      const fullName = `${s.nombre} ${s.apellido}`.toLowerCase();
      return fullName.includes(search.toLowerCase());
    });

  const handleSelect = (fullName) => {
    if (multiple) {
      let newSelection;
      if (selectedValues.includes(fullName)) {
        newSelection = selectedValues.filter(n => n !== fullName);
      } else {
        newSelection = [...selectedValues, fullName];
      }
      onChange(newSelection.join(', '));
    } else {
      onChange(fullName);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mb-3 relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <div 
        className="w-full p-2 border border-slate-300 rounded-lg bg-white min-h-[42px] cursor-pointer flex flex-wrap gap-2 items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedValues.length === 0 && <span className="text-slate-400 text-sm">Seleccionar...</span>}
        {selectedValues.map(name => (
          <span key={name} className={`${multiple ? 'bg-pink-100 text-pink-700 rounded-full' : 'bg-transparent text-slate-800'} px-2 py-0.5 text-sm font-medium flex items-center gap-1`}>
            {name}
            {multiple && (
              <button type="button" onClick={(e) => { e.stopPropagation(); handleSelect(name); }} className="hover:text-pink-900">
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        <div className="ml-auto"><ChevronDown size={16} className="text-slate-400" /></div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-white border-b border-slate-100">
            <input type="text" placeholder="Buscar..." className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-pink-400" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
          <div className="p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(sister => {
                const fullName = `${sister.nombre} ${sister.apellido}`;
                const isSelected = selectedValues.includes(fullName);
                return (
                  <div key={sister.id} onClick={() => handleSelect(fullName)} className={`flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition ${isSelected ? 'bg-pink-50 text-pink-700' : 'hover:bg-slate-50 text-slate-700'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-pink-500 border-pink-500' : 'border-slate-300 bg-white'}`}>
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                    {fullName}
                  </div>
                )
              })
            ) : <p className="text-xs text-slate-400 p-2 text-center">No se encontraron resultados.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

// --- GESTOR DE COMPROMISOS (MODAL) ---
const CommitmentModal = ({ sister, onClose, onSave }) => {
  const [status, setStatus] = useState(null); // 'fulfilled' | 'unfulfilled'
  const [data, setData] = useState({
    updateCovenant: false, // Update boolean field?
    nextCovenant: '',
    nextDate: '',
    reason: '',
    actions: '',
    newDate: '',
    completionDate: new Date().toISOString().split('T')[0] // Default to today
  });

  const covenantKeyMap = {
    'Bautismo': 'bautismo', 'Confirmación': 'confirmacion', 'Investidura': 'investidura', 
    'Sellamiento': 'sellamiento', 'Cta. FamilySearch': 'familySearch', 
    'Obra Vicaria': 'obraVicaria', 'Bendición Patriarcal': 'bendicionPatriarcal', 
    'Sacerdocio': 'sacerdocio'
  };

  const handleSave = () => {
    let updates = {};
    const today = new Date().toISOString().split('T')[0];

    if (status === 'fulfilled') {
      const doneDate = data.completionDate || today;
      // 1. Actualizar el booleano si aplica
      if (data.updateCovenant && covenantKeyMap[sister.proximoConvenio]) {
        updates[covenantKeyMap[sister.proximoConvenio]] = true;
      }
      // 2. Registrar el logro en observaciones con la fecha real
      const log = `${doneDate}: CUMPLIÓ meta de "${sister.proximoConvenio}". \n`;
      updates.observaciones = (sister.observaciones || '') + '\n' + log;
      // 3. Establecer la nueva meta
      updates.proximoConvenio = data.nextCovenant || '';
      updates.fechaMeta = data.nextDate || '';

    } else if (status === 'unfulfilled') {
      // 1. Reprogramar
      updates.fechaMeta = data.newDate;
      // 2. Registrar razón y acción en observaciones
      const log = `${today}: REPROGRAMADO "${sister.proximoConvenio}". \nMOTIVO: ${data.reason}. \nACCIONES: ${data.actions}. \n`;
      updates.observaciones = (sister.observaciones || '') + '\n' + log;
    }

    onSave(sister.id, updates);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2"><Activity size={20}/> Gestionar Compromiso</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        
        <div className="p-6">
          <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Meta Actual</p>
            <p className="text-xl font-bold text-slate-800">{sister.proximoConvenio}</p>
            <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
              <Calendar size={14}/> Vencimiento: <span className="font-medium">{sister.fechaMeta}</span>
            </p>
          </div>

          {!status ? (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setStatus('fulfilled')} className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-slate-100 hover:border-green-500 hover:bg-green-50 transition group">
                <div className="bg-green-100 p-3 rounded-full text-green-600 group-hover:bg-green-500 group-hover:text-white transition"><CheckSquare size={32}/></div>
                <span className="font-bold text-slate-700">¡Se cumplió!</span>
              </button>
              <button onClick={() => setStatus('unfulfilled')} className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-slate-100 hover:border-orange-500 hover:bg-orange-50 transition group">
                <div className="bg-orange-100 p-3 rounded-full text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition"><XSquare size={32}/></div>
                <span className="font-bold text-slate-700">No se cumplió</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {status === 'fulfilled' ? (
                <div className="animate-in slide-in-from-right">
                  <div className="bg-green-50 text-green-800 p-3 rounded-lg mb-4 text-sm font-medium flex items-center gap-2">
                    <CheckCircle size={18}/> ¡Excelente noticia! Actualicemos el historial.
                  </div>
                  
                  {/* NUEVO CAMPO DE FECHA DE CUMPLIMIENTO */}
                  <InputGroup 
                    label="Fecha Real de Cumplimiento" 
                    type="date" 
                    value={data.completionDate} 
                    onChange={e => setData({...data, completionDate: e.target.value})} 
                  />
                  
                  {covenantKeyMap[sister.proximoConvenio] && (
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 mb-4">
                      <input type="checkbox" checked={data.updateCovenant} onChange={e => setData({...data, updateCovenant: e.target.checked})} className="w-5 h-5 accent-pink-600"/>
                      <span className="text-sm">Marcar <b>{sister.proximoConvenio}</b> como realizado en su ficha.</span>
                    </label>
                  )}

                  <h4 className="font-bold text-slate-700 mb-2">¿Cuál es el siguiente paso?</h4>
                  <InputGroup label="Nueva Meta" name="nextCovenant" value={data.nextCovenant} onChange={e => setData({...data, nextCovenant: e.target.value})} 
                    options={["Bautismo", "Confirmación", "Investidura", "Sellamiento", "Ir al Templo", "Curso Autosuficiencia", "Cta. FamilySearch", "Obra Vicaria", "Bendición Patriarcal", "Otro"]}
                  />
                  <InputGroup label="Fecha para la nueva meta" type="date" value={data.nextDate} onChange={e => setData({...data, nextDate: e.target.value})} />
                </div>
              ) : (
                <div className="animate-in slide-in-from-right">
                  <div className="bg-orange-50 text-orange-800 p-3 rounded-lg mb-4 text-sm font-medium flex items-center gap-2">
                    <AlertTriangle size={18}/> Registremos el apoyo necesario.
                  </div>
                  <InputGroup label="¿Por qué no se cumplió?" type="textarea" placeholder="Ej: Problemas de salud, falta de transporte..." value={data.reason} onChange={e => setData({...data, reason: e.target.value})} />
                  <InputGroup label="Acciones de apoyo requeridas" placeholder="Ej: Las ministrantes la visitarán, se buscará transporte..." value={data.actions} onChange={e => setData({...data, actions: e.target.value})} />
                  <InputGroup label="Nueva Fecha Comprometida" type="date" value={data.newDate} onChange={e => setData({...data, newDate: e.target.value})} />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button onClick={() => setStatus(null)} className="flex-1 py-2 text-slate-500 font-medium hover:bg-slate-100 rounded-lg">Atrás</button>
                <button onClick={handleSave} className="flex-1 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 shadow-lg">Guardar Cambios</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- FORMULARIO PRINCIPAL (Igual que antes) ---
const SisterForm = ({ onSubmit, onCancel, initialData, allSisters }) => {
  const [formData, setFormData] = useState(initialData || {
    nombre: '', apellido: '', telefono: '', direccion: '', familia: '',
    hobbies: '', talentos: '', actividadesSugeridas: '',
    amigasCercanas: '', personasExtraña: '', quiereConocer: '',
    bautismo: false, confirmacion: false, sacerdocio: false, familySearch: false,
    obraVicaria: false, bendicionPatriarcal: false, investidura: false, sellamiento: false,
    proximoConvenio: '', fechaMeta: '', encargadoSeguimiento: '', observaciones: '', llamamiento: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-6 bg-pink-600 text-white flex justify-between items-center sticky top-0 z-10 shadow-md">
          <h2 className="text-xl font-bold flex items-center gap-2"><User /> {initialData ? 'Editar Registro' : 'Nueva Hermana'}</h2>
          <button onClick={onCancel} className="hover:bg-pink-700 p-2 rounded-full transition"><X size={20}/></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-pink-600 font-bold mb-3 flex items-center gap-2"><Smile size={18}/> Datos Personales</h3>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} />
                <InputGroup label="Apellido" name="apellido" value={formData.apellido} onChange={handleChange} />
              </div>
              <InputGroup label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} />
              <InputGroup label="Dirección" name="direccion" value={formData.direccion} onChange={handleChange} />
              <InputGroup label="Familia con la que vive" name="familia" value={formData.familia} onChange={handleChange} />
              <InputGroup label="Llamamiento Actual" name="llamamiento" value={formData.llamamiento} onChange={handleChange} />
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-pink-600 font-bold mb-3 flex items-center gap-2"><Heart size={18}/> Intereses y Social</h3>
              <InputGroup label="Hobbies" name="hobbies" value={formData.hobbies} onChange={handleChange} placeholder="Ej: Jardinería, Lectura" />
              <InputGroup label="Talentos" name="talentos" value={formData.talentos} onChange={handleChange} placeholder="Ej: Piano, Enseñar" />
              <InputGroup label="Actividades Sugeridas" name="actividadesSugeridas" value={formData.actividadesSugeridas} onChange={handleChange} type="textarea" />
              <div className="border-t border-slate-200 pt-4 mt-2">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Relaciones en el Barrio</p>
                <SisterSelect multiple label="Hermanas cercanas" sistersList={allSisters} currentSisterId={initialData?.id} value={formData.amigasCercanas} onChange={(val) => handleSelectChange('amigasCercanas', val)} />
                <SisterSelect multiple label="Personas que extraña" sistersList={allSisters} currentSisterId={initialData?.id} value={formData.personasExtraña} onChange={(val) => handleSelectChange('personasExtraña', val)} />
                <SisterSelect multiple label="Le gustaría conocer a" sistersList={allSisters} currentSisterId={initialData?.id} value={formData.quiereConocer} onChange={(val) => handleSelectChange('quiereConocer', val)} />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h3 className="text-blue-700 font-bold mb-3 flex items-center gap-2"><CheckCircle size={18}/> Senda de los Convenios</h3>
              <div className="grid grid-cols-2 gap-3">
                {[{k:'bautismo', l:'Bautismo'}, {k:'confirmacion', l:'Confirmación'}, {k:'investidura', l:'Investidura'}, {k:'sellamiento', l:'Sellamiento'}, {k:'familySearch', l:'Cta. FamilySearch'}, {k:'obraVicaria', l:'Obra Vicaria'}, {k:'bendicionPatriarcal', l:'Bendición Pat.'}, {k:'sacerdocio', l:'Sacerdocio'}].map(item => (
                  <label key={item.k} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition border border-transparent hover:border-blue-100">
                    <input type="checkbox" name={item.k} checked={formData[item.k]} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 accent-blue-600" />
                    <span className="text-sm text-slate-700 font-medium">{item.l}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <h3 className="text-yellow-700 font-bold mb-3 flex items-center gap-2"><Activity size={18}/> Seguimiento de Convenios</h3>
              <InputGroup label="Próximo Convenio / Meta" name="proximoConvenio" value={formData.proximoConvenio} onChange={handleChange} options={["Bautismo", "Confirmación", "Investidura", "Sellamiento", "Ir al Templo", "Curso Autosuficiencia", "Cta. FamilySearch", "Obra Vicaria", "Bendición Patriarcal", "Otro"]} />
              <InputGroup label="Fecha Meta" name="fechaMeta" type="date" value={formData.fechaMeta} onChange={handleChange} />
              <SisterSelect label="Encargada del Seguimiento" sistersList={allSisters} currentSisterId={initialData?.id} value={formData.encargadoSeguimiento} onChange={(val) => handleSelectChange('encargadoSeguimiento', val)} />
              <InputGroup label="Observaciones Privadas" name="observaciones" type="textarea" value={formData.observaciones} onChange={handleChange} />
            </div>
            <div className="flex justify-end gap-3 pt-6">
               <button type="button" onClick={onCancel} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
               <button type="submit" className="px-5 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 shadow-lg font-bold flex items-center gap-2"><Save size={18}/> Guardar Datos</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [view, setView] = useState('dashboard'); 
  const [sisters, setSisters] = useState([]);
  const [selectedSister, setSelectedSister] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // Estado para filtros activos del dashboard
  const [activeFilter, setActiveFilter] = useState({ label: '', fn: null });
  // Estado para el modal de gestión de compromisos
  const [commitmentSister, setCommitmentSister] = useState(null);

  useEffect(() => {
    if (db) {
      const unsubscribe = onSnapshot(collection(db, "hermanas"), (snap) => {
        setSisters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubscribe();
    } else {
      setSisters([
        { id: 1, nombre: 'Ana', apellido: 'Ruiz', investidura: true, hobbies: 'Cocina', proximoConvenio: 'Sellamiento', fechaMeta: new Date().toISOString().split('T')[0], personasExtraña: 'Carla Diaz', quiereConocer: 'Elena Paz' },
        { id: 2, nombre: 'Carla', apellido: 'Diaz', investidura: false, hobbies: 'Jardinería', proximoConvenio: 'Investidura', fechaMeta: '2024-06-15', quiereConocer: 'Ana Ruiz', encargadoSeguimiento: 'Elena Paz' },
        { id: 3, nombre: 'Elena', apellido: 'Paz', investidura: true, sellamiento: true, proximoConvenio: 'Ir al Templo' },
      ]);
    }
  }, []);

  const handleSave = async (data) => {
    if (db) {
      selectedSister ? await updateDoc(doc(db, "hermanas", selectedSister.id), data) : await addDoc(collection(db, "hermanas"), data);
    } else {
      const newItem = { ...data, id: Date.now() };
      setSisters(prev => selectedSister ? prev.map(s => s.id === selectedSister.id ? newItem : s) : [...prev, newItem]);
    }
    setShowForm(false); setSelectedSister(null);
  };

  const handleDelete = async (id) => {
    if(confirm("¿Eliminar registro?")) {
        if(db) await deleteDoc(doc(db, "hermanas", id));
        else setSisters(prev => prev.filter(s => s.id !== id));
        setView('list');
    }
  };

  const handleCommitmentUpdate = async (id, updates) => {
    if (db) {
      await updateDoc(doc(db, "hermanas", id), updates);
    } else {
      setSisters(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
    setCommitmentSister(null); // Cerrar modal
  };

  // Función para aplicar filtros desde el dashboard
  const applyFilter = (label, filterFn) => {
    setActiveFilter({ label, fn: filterFn });
    setView('list');
  };

  const stats = useMemo(() => {
    const total = sisters.length;
    const topHobbies = processTags(sisters, 'hobbies');
    const topTalentos = processTags(sisters, 'talentos');
    const topExtrañadas = processMentions(sisters, 'personasExtraña');
    const topSolicitadas = processMentions(sisters, 'quiereConocer');
    const necesitanAtencion = sisters.filter(s => s.personasExtraña && s.personasExtraña.length > 2).length;
    const buscandoAmistad = sisters.filter(s => s.quiereConocer && s.quiereConocer.length > 2).length;
    const pasos = {
      bautismo: sisters.filter(s => s.bautismo).length,
      investidura: sisters.filter(s => s.investidura).length,
      sellamiento: sisters.filter(s => s.sellamiento).length
    };
    return { total, topHobbies, topTalentos, necesitanAtencion, buscandoAmistad, pasos, topExtrañadas, topSolicitadas };
  }, [sisters]);

  const upcomingCommitments = useMemo(() => {
    return sisters.filter(s => {
      if (!s.fechaMeta || !s.proximoConvenio) return false;
      const days = getDaysRemaining(s.fechaMeta);
      return days <= 15;
    }).sort((a, b) => new Date(a.fechaMeta) - new Date(b.fechaMeta));
  }, [sisters]);

  const relatedSisters = useMemo(() => {
    if(!selectedSister) return [];
    const myHobbies = selectedSister.hobbies ? selectedSister.hobbies.toLowerCase().split(',').map(s=>s.trim()) : [];
    return sisters.filter(s => s.id !== selectedSister.id && s.hobbies && s.hobbies.toLowerCase().split(',').some(h => myHobbies.includes(h.trim()))).slice(0, 3);
  }, [selectedSister, sisters]);

  const sistersUnderCare = useMemo(() => {
    if(!selectedSister) return [];
    const myName = `${selectedSister.nombre} ${selectedSister.apellido}`;
    return sisters.filter(s => s.encargadoSeguimiento === myName);
  }, [selectedSister, sisters]);

  const filteredList = sisters.filter(s => {
    const matchesSearch = (s.nombre + ' ' + s.apellido).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter.fn ? activeFilter.fn(s) : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-10">
      <nav className="bg-white border-b border-pink-100 sticky top-0 z-20 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-pink-700">
          <Heart className="fill-pink-600 animate-pulse" />
          <h1 className="text-xl font-bold tracking-tight hidden md:block">Sociedad de Socorro</h1>
          <span className="md:hidden font-bold">SS</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setView('dashboard')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'dashboard' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><BarChart3 size={18} className="inline mr-1"/> Resumen</button>
            <button onClick={() => setView('list')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'list' || view === 'details' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ListFilter size={18} className="inline mr-1"/> Directorio</button>
          </div>
          <button onClick={() => { setSelectedSister(null); setShowForm(true); }} className="bg-pink-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-pink-700 flex items-center gap-2 shadow-lg ml-2" title="Agregar Nueva"><Plus size={20} /> <span className="hidden md:inline">Nueva</span></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {view === 'dashboard' && (
          <div className="animate-in fade-in space-y-6">
            
            {/* ALERTAS DE COMPROMISOS */}
            {upcomingCommitments.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-yellow-800 flex items-center gap-2 mb-4">
                  <AlertTriangle className="animate-pulse" /> Compromisos por Vencer (Alerta de 15 días)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingCommitments.map(s => {
                    const days = getDaysRemaining(s.fechaMeta);
                    return (
                      <div key={s.id} className="bg-white p-4 rounded-lg shadow-sm border border-yellow-100 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-slate-800">{s.nombre} {s.apellido}</span>
                            <Badge color={days < 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                              {days < 0 ? `Venció hace ${Math.abs(days)} días` : `Vence en ${days} días`}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">Meta: <b>{s.proximoConvenio}</b></p>
                          <p className="text-xs text-slate-400 flex items-center gap-1"><User size={12}/> Apoyo: {s.encargadoSeguimiento || 'Sin asignar'}</p>
                        </div>
                        <button onClick={() => setCommitmentSister(s)} className="mt-3 w-full py-2 bg-yellow-100 text-yellow-800 font-bold text-sm rounded hover:bg-yellow-200 transition">Gestionar / Actualizar</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard 
                icon={Users} label="Total Hermanas Registradas" value={stats.total} color="bg-pink-100 text-pink-600" 
                onClick={() => applyFilter('Total Hermanas', () => true)}
              />
              <StatCard 
                icon={Award} label="Hnas Investidas" value={stats.pasos.investidura} color="bg-purple-100 text-purple-600" 
                onClick={() => applyFilter('Investidas', s => s.investidura)}
              />
              <StatCard 
                icon={Phone} label="Necesitan Contacto" value={stats.necesitanAtencion} color="bg-orange-100 text-orange-600" 
                onClick={() => applyFilter('Necesitan Contacto', s => s.personasExtraña && s.personasExtraña.length > 2)}
              />
              <StatCard 
                icon={Smile} label="Quieren Conocer" value={stats.buscandoAmistad} color="bg-green-100 text-green-600" 
                onClick={() => applyFilter('Quieren Conocer', s => s.quiereConocer && s.quiereConocer.length > 2)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><UserPlus className="text-blue-500"/> Top: Quieren Conocerlas</h3>
                  <div className="space-y-3">
                    {stats.topSolicitadas.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded bg-blue-50/50">
                        <span className="font-medium text-slate-700">#{idx+1} {item.name}</span>
                        <Badge color="bg-blue-200 text-blue-800">{item.value} solicitudes</Badge>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><HeartHandshake className="text-pink-500"/> Top: Las más Extrañadas</h3>
                  <div className="space-y-3">
                    {stats.topExtrañadas.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded bg-pink-50/50">
                        <span className="font-medium text-slate-700">#{idx+1} {item.name}</span>
                        <Badge color="bg-pink-200 text-pink-800">{item.value} menciones</Badge>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Smile className="text-blue-500"/> Intereses Comunes</h3>
                <div className="h-64">
                   {stats.topHobbies.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={stats.topHobbies} margin={{left: 20}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                        <Bar 
                          dataKey="value" 
                          fill="#3b82f6" 
                          radius={[0, 4, 4, 0]} 
                          barSize={20} 
                          onClick={(data) => applyFilter(`Hobby: ${data.name}`, s => s.hobbies && s.hobbies.toLowerCase().includes(data.name.toLowerCase()))}
                          cursor="pointer"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                   ) : <p className="text-center text-slate-400 mt-20">Faltan datos</p>}
                </div>
                <p className="text-xs text-center text-slate-400 mt-2">Haz clic en una barra para filtrar</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Award className="text-purple-500"/> Banco de Talentos</h3>
                 <div className="h-64">
                    {stats.topTalentos.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie 
                            data={stats.topTalentos} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                            onClick={(data) => applyFilter(`Talento: ${data.name}`, s => s.talentos && s.talentos.toLowerCase().includes(data.name.toLowerCase()))}
                            cursor="pointer"
                         >
                           {stats.topTalentos.map((entry, index) => <Cell key={`cell-${index}`} fill={['#a855f7', '#d946ef', '#ec4899', '#f43f5e'][index % 4]} />)}
                         </Pie>
                         <Tooltip />
                         <Legend verticalAlign="bottom" height={36}/>
                       </PieChart>
                     </ResponsiveContainer>
                    ) : <p className="text-center text-slate-400 mt-20">Faltan datos</p>}
                 </div>
                 <p className="text-xs text-center text-slate-400 mt-2">Haz clic en una sección para filtrar</p>
              </div>
            </div>
          </div>
        )}

        {(view === 'list' || view === 'details') && (
          <div className="animate-in slide-in-from-bottom-2">
            {!selectedSister ? (
              <>
                <div className="mb-6 space-y-4">
                    {/* BARRA DE BÚSQUEDA */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input type="text" placeholder="Buscar hermana..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none bg-white shadow-sm"
                          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* INDICADOR DE FILTRO ACTIVO */}
                    {activeFilter.label && (
                      <div className="flex items-center justify-between bg-pink-50 text-pink-800 px-4 py-2 rounded-lg border border-pink-100 animate-in fade-in">
                        <div className="flex items-center gap-2 font-medium">
                          <Filter size={16}/> Filtro activo: <span className="font-bold">{activeFilter.label}</span>
                        </div>
                        <button onClick={() => setActiveFilter({ label: '', fn: null })} className="p-1 hover:bg-pink-100 rounded-full transition text-pink-600">
                          <X size={18}/>
                        </button>
                      </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredList.length > 0 ? filteredList.map(sister => (
                    <div key={sister.id} onClick={() => {setSelectedSister(sister); setView('details')}} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-pink-200 cursor-pointer transition group">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-pink-100 group-hover:text-pink-600 transition">
                              <User size={20}/>
                           </div>
                           <div>
                              <h3 className="font-bold text-lg text-slate-800">{sister.nombre} {sister.apellido}</h3>
                              <p className="text-xs text-slate-500">{sister.llamamiento || "Sin llamamiento"}</p>
                           </div>
                        </div>
                        {sister.investidura && <CheckCircle size={16} className="text-purple-500" title="Investida"/>}
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-10 text-center text-slate-400">
                      <p>No se encontraron hermanas con este criterio.</p>
                      {activeFilter.label && <button onClick={() => setActiveFilter({ label: '', fn: null })} className="mt-2 text-pink-600 font-medium hover:underline">Limpiar filtro</button>}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                     <button onClick={() => {setSelectedSister(null); setView('list')}} className="bg-slate-700 hover:bg-slate-600 p-2 rounded-full transition"><X size={16}/></button>
                     <div><h1 className="text-2xl font-bold">{selectedSister.nombre} {selectedSister.apellido}</h1><p className="text-slate-300 text-sm">{selectedSister.llamamiento}</p></div>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => setShowForm(true)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded font-medium">Editar</button>
                     <button onClick={() => handleDelete(selectedSister.id)} className="bg-red-500/80 hover:bg-red-600 px-4 py-2 rounded font-medium">Borrar</button>
                   </div>
                </div>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">Social</h4>
                            <p className="text-sm mb-1"><span className="font-bold text-slate-500">Cercana a:</span> {selectedSister.amigasCercanas || "-"}</p>
                            <p className="text-sm mb-1"><span className="font-bold text-slate-500">Extraña a:</span> {selectedSister.personasExtraña || "-"}</p>
                            <p className="text-sm mb-1"><span className="font-bold text-slate-500">Quiere conocer:</span> {selectedSister.quiereConocer || "-"}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                           <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2"><Smile size={14}/> Podría llevarse bien con:</h4>
                           {relatedSisters.length > 0 ? (
                             <ul className="text-sm space-y-1">
                               {relatedSisters.map(s => (
                                 <li key={s.id} className="flex items-center gap-1 text-slate-700"><ArrowRight size={12} className="text-blue-400"/> {s.nombre} {s.apellido}</li>
                               ))}
                             </ul>
                           ) : <p className="text-xs text-blue-400 italic">No se encontraron coincidencias.</p>}
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">Convenios</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSister.bautismo && <Badge color="bg-green-100 text-green-700">Bautismo</Badge>}
                                    {selectedSister.confirmacion && <Badge color="bg-green-100 text-green-700">Confirmación</Badge>}
                                    {selectedSister.investidura && <Badge color="bg-purple-100 text-purple-700">Investidura</Badge>}
                                    {selectedSister.sellamiento && <Badge color="bg-purple-100 text-purple-700">Sellamiento</Badge>}
                                </div>
                            </div>
                            <div>
                               <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">Responsabilidades</h4>
                               {sistersUnderCare.length > 0 ? (
                                 <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 mb-1">ENCARGADA DE CUIDAR A:</p>
                                    {sistersUnderCare.map(s => <p key={s.id} className="text-sm font-medium text-slate-800">• {s.nombre} {s.apellido}</p>)}
                                 </div>
                               ) : <p className="text-sm text-slate-400 italic">No tiene asignaciones de seguimiento.</p>}
                            </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex flex-col md:flex-row gap-4 justify-between items-start">
                            <div>
                                <h4 className="font-bold text-yellow-800 mb-1">Próxima Meta Personal</h4>
                                <p className="text-lg font-bold text-slate-800">{selectedSister.proximoConvenio || "Sin definir"}</p>
                                <p className="text-sm text-yellow-700">Fecha: {selectedSister.fechaMeta || "--"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-yellow-700 uppercase">Recibe apoyo de:</p>
                                <div className="flex items-center gap-2 justify-end mt-1">
                                    <User size={16} className="text-yellow-600"/>
                                    <span className="font-medium text-slate-800">{selectedSister.encargadoSeguimiento || "Nadie asignado"}</span>
                                </div>
                            </div>
                        </div>
                        {selectedSister.observaciones && (
                          <div className="mt-4 p-4 bg-slate-50 rounded border border-slate-200">
                             <h4 className="font-bold text-slate-600 text-xs uppercase mb-2">Historial de Observaciones</h4>
                             <p className="text-sm text-slate-700 whitespace-pre-line">{selectedSister.observaciones}</p>
                          </div>
                        )}
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}
      </main>
      {showForm && <SisterForm onSubmit={handleSave} onCancel={() => { setShowForm(false); setSelectedSister(null); }} initialData={selectedSister} allSisters={sisters}/>}
      {commitmentSister && <CommitmentModal sister={commitmentSister} onClose={() => setCommitmentSister(null)} onSave={handleCommitmentUpdate} />}
    </div>
  );
}