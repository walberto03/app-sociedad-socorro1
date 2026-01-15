import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Heart, Search, Plus, Save, X, Activity, 
  Calendar, CheckCircle, Smile, Award, Phone, User, 
  PieChart as PieIcon, BarChart3, ListFilter 
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend 
} from 'recharts';

// --- CONFIGURACIÓN DE FIREBASE ---
// PEGA AQUÍ TUS CREDENCIALES COPIADAS DE LA CONSOLA
// Si no las tienes a mano, déjalo así y funcionará en "Modo Demo"
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
  // Solo inicializa si hay configuración real
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
// Función para contar frecuencias de texto separado por comas (Ej: "Cocina, Leer")
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

// --- COMPONENTES UI ---

const Badge = ({ children, color = "bg-blue-100 text-blue-800" }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
    {children}
  </span>
);

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
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

// --- FORMULARIO ---
const SisterForm = ({ onSubmit, onCancel, initialData }) => {
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-6 bg-pink-600 text-white flex justify-between items-center sticky top-0 z-10 shadow-md">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User /> {initialData ? 'Editar Registro' : 'Nueva Hermana'}
          </h2>
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
              <p className="text-xs text-slate-500 mb-2 italic">Separa los hobbies y talentos con comas (ej: "Cocina, Canto").</p>
              <InputGroup label="Hobbies" name="hobbies" value={formData.hobbies} onChange={handleChange} placeholder="Ej: Jardinería, Lectura" />
              <InputGroup label="Talentos" name="talentos" value={formData.talentos} onChange={handleChange} placeholder="Ej: Piano, Enseñar" />
              <InputGroup label="Actividades Sugeridas" name="actividadesSugeridas" value={formData.actividadesSugeridas} onChange={handleChange} type="textarea" />
              <InputGroup label="Hermanas cercanas" name="amigasCercanas" value={formData.amigasCercanas} onChange={handleChange} />
              <InputGroup label="Personas que extraña" name="personasExtraña" value={formData.personasExtraña} onChange={handleChange} />
              <InputGroup label="Le gustaría conocer a" name="quiereConocer" value={formData.quiereConocer} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h3 className="text-blue-700 font-bold mb-3 flex items-center gap-2"><CheckCircle size={18}/> Senda de los Convenios</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {k:'bautismo', l:'Bautismo'}, {k:'confirmacion', l:'Confirmación'},
                  {k:'investidura', l:'Investidura'}, {k:'sellamiento', l:'Sellamiento'},
                  {k:'familySearch', l:'Cta. FamilySearch'}, {k:'obraVicaria', l:'Obra Vicaria'},
                  {k:'bendicionPatriarcal', l:'Bendición Pat.'}, {k:'sacerdocio', l:'Sacerdocio'}
                ].map(item => (
                  <label key={item.k} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition border border-transparent hover:border-blue-100">
                    <input type="checkbox" name={item.k} checked={formData[item.k]} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 accent-blue-600" />
                    <span className="text-sm text-slate-700 font-medium">{item.l}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <h3 className="text-yellow-700 font-bold mb-3 flex items-center gap-2"><Activity size={18}/> Seguimiento Pastoral</h3>
              <InputGroup 
                label="Próximo Convenio / Meta" 
                name="proximoConvenio" 
                value={formData.proximoConvenio} 
                onChange={handleChange} 
                options={["Bautismo", "Investidura", "Sellamiento", "Ir al Templo", "Curso Autosuficiencia", "Otro"]}
              />
              <InputGroup label="Fecha Meta" name="fechaMeta" type="date" value={formData.fechaMeta} onChange={handleChange} />
              <InputGroup label="Encargada del Seguimiento" name="encargadoSeguimiento" value={formData.encargadoSeguimiento} onChange={handleChange} />
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

  // Carga de datos
  useEffect(() => {
    if (db) {
      const unsubscribe = onSnapshot(collection(db, "hermanas"), (snap) => {
        setSisters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubscribe();
    } else {
      // DATOS DE PRUEBA PARA QUE VEAS LAS GRÁFICAS
      setSisters([
        { id: 1, nombre: 'Ana', apellido: 'Ruiz', investidura: true, hobbies: 'Cocina, Lectura', talentos: 'Piano', proximoConvenio: 'Sellamiento', fechaMeta: '2024-05-10', personasExtraña: 'Hermana Gomez' },
        { id: 2, nombre: 'Carla', apellido: 'Diaz', investidura: false, hobbies: 'Jardinería, Cocina', talentos: 'Canto', proximoConvenio: 'Investidura', fechaMeta: '2024-06-15', quiereConocer: 'Ana Ruiz' },
        { id: 3, nombre: 'Elena', apellido: 'Paz', investidura: true, sellamiento: true, hobbies: 'Caminar, Lectura', talentos: 'Enseñar', proximoConvenio: 'Ir al Templo' },
        { id: 4, nombre: 'Sofia', apellido: 'López', investidura: false, hobbies: 'Costura', talentos: 'Organizar', proximoConvenio: 'Investidura', fechaMeta: '2024-08-01' },
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

  // --- LÓGICA DE ESTADÍSTICAS AVANZADAS ---
  const stats = useMemo(() => {
    const total = sisters.length;
    const investidas = sisters.filter(s => s.investidura).length;
    
    // Procesar Hobbies y Talentos
    const topHobbies = processTags(sisters, 'hobbies');
    const topTalentos = processTags(sisters, 'talentos');

    // Correlaciones Sociales
    const necesitanAtencion = sisters.filter(s => s.personasExtraña && s.personasExtraña.length > 2).length;
    const buscandoAmistad = sisters.filter(s => s.quiereConocer && s.quiereConocer.length > 2).length;

    // Próximos pasos (Embudo)
    const pasos = {
      bautismo: sisters.filter(s => s.bautismo).length,
      investidura: investidas,
      sellamiento: sisters.filter(s => s.sellamiento).length
    };

    return { total, topHobbies, topTalentos, necesitanAtencion, buscandoAmistad, pasos };
  }, [sisters]);

  const filteredList = sisters.filter(s => (s.nombre + ' ' + s.apellido).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-10">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-pink-100 sticky top-0 z-20 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-pink-700">
          <Heart className="fill-pink-600 animate-pulse" />
          <h1 className="text-xl font-bold tracking-tight hidden md:block">Sociedad de Socorro</h1>
          <span className="md:hidden font-bold">SS</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setView('dashboard')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'dashboard' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
             <BarChart3 size={18} className="inline mr-1"/> Resumen
          </button>
          <button onClick={() => setView('list')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'list' || view === 'details' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
             <ListFilter size={18} className="inline mr-1"/> Directorio
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        
        {/* === VISTA DASHBOARD RECARGADO === */}
        {view === 'dashboard' && (
          <div className="animate-in fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-4">
              <div>
                 <h2 className="text-2xl font-bold text-slate-800">Estadísticas del Barrio</h2>
                 <p className="text-slate-500">Visualiza los intereses y necesidades del grupo.</p>
              </div>
            </div>

            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Asistencia" value={stats.total} color="bg-pink-100 text-pink-600" />
              <StatCard icon={Award} label="Hnas Investidas" value={stats.pasos.investidura} color="bg-purple-100 text-purple-600" />
              <StatCard icon={Phone} label="Necesitan Contacto" value={stats.necesitanAtencion} color="bg-orange-100 text-orange-600" />
              <StatCard icon={Smile} label="Quieren Conocer" value={stats.buscandoAmistad} color="bg-green-100 text-green-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gráfica de Hobbies */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Smile className="text-blue-500"/> Intereses Comunes (Top 6)
                </h3>
                <div className="h-64">
                   {stats.topHobbies.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={stats.topHobbies} margin={{left: 20}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                        <Tooltip contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                          {stats.topHobbies.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                   ) : <p className="text-center text-slate-400 mt-20">Faltan datos de hobbies</p>}
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">Útil para planear noches de hogar o talleres.</p>
              </div>

              {/* Gráfica de Talentos */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Award className="text-purple-500"/> Banco de Talentos
                </h3>
                <div className="h-64">
                   {stats.topTalentos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={stats.topTalentos} 
                          cx="50%" cy="50%" 
                          innerRadius={60} 
                          outerRadius={80} 
                          paddingAngle={5} 
                          dataKey="value"
                        >
                          {stats.topTalentos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#a855f7', '#d946ef', '#ec4899', '#f43f5e'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                   ) : <p className="text-center text-slate-400 mt-20">Faltan datos de talentos</p>}
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">Ideal para asignar números musicales o clases.</p>
              </div>
            </div>

            {/* Próximos Compromisos */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Calendar className="text-yellow-500"/> Próximos Compromisos / Metas
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sisters.filter(s => s.fechaMeta).sort((a,b) => new Date(a.fechaMeta) - new Date(b.fechaMeta)).slice(0, 6).map(s => (
                    <div key={s.id} className="flex items-start gap-3 p-3 bg-yellow-50/50 rounded-lg border border-yellow-100">
                      <div className="bg-white p-2 rounded border border-yellow-100 text-center min-w-[50px]">
                         <span className="block text-xs text-slate-400 uppercase">{new Date(s.fechaMeta).toLocaleString('es', {month:'short'})}</span>
                         <span className="block text-lg font-bold text-slate-800">{new Date(s.fechaMeta).getDate()+1}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{s.nombre} {s.apellido}</p>
                        <p className="text-sm text-yellow-700 font-medium">{s.proximoConvenio}</p>
                        <p className="text-xs text-slate-500 mt-1">Ayuda: {s.encargadoSeguimiento || "Nadie asignado"}</p>
                      </div>
                    </div>
                  ))}
                  {sisters.filter(s => s.fechaMeta).length === 0 && <p className="text-slate-400 italic col-span-3 text-center">No hay metas con fecha programada.</p>}
               </div>
            </div>
          </div>
        )}

        {/* === VISTA LISTA (Sin Cambios drásticos, solo estilo) === */}
        {(view === 'list' || view === 'details') && (
          <div className="animate-in slide-in-from-bottom-2">
            {!selectedSister ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Buscar hermana..." 
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none bg-slate-50 focus:bg-white transition"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => { setSelectedSister(null); setShowForm(true); }}
                    className="bg-pink-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-pink-700 flex items-center gap-2 shadow-lg hover:shadow-pink-200 transition"
                  >
                    <Plus size={20} /> Agregar Nueva
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredList.map(sister => (
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
                      <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2 flex-wrap">
                          {sister.hobbies && <Badge color="bg-blue-50 text-blue-600">{sister.hobbies.split(',')[0]}</Badge>}
                          {sister.talentos && <Badge color="bg-purple-50 text-purple-600">{sister.talentos.split(',')[0]}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* DETALLE (IGUAL QUE ANTES, YA FUNCIONABA BIEN) */
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                     <button onClick={() => {setSelectedSister(null); setView('list')}} className="bg-slate-700 hover:bg-slate-600 p-2 rounded-full transition"><X size={16}/></button>
                     <div>
                        <h1 className="text-2xl font-bold">{selectedSister.nombre} {selectedSister.apellido}</h1>
                        <p className="text-slate-300 text-sm">{selectedSister.llamamiento}</p>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => setShowForm(true)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded font-medium">Editar</button>
                     <button onClick={() => handleDelete(selectedSister.id)} className="bg-red-500/80 hover:bg-red-600 px-4 py-2 rounded font-medium">Borrar</button>
                   </div>
                </div>
                {/* ... El resto del detalle se mantiene similar o se puede expandir si quieres ... */}
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">Intereses</h4>
                        <p className="text-sm mb-1"><span className="font-bold text-slate-500">Hobbies:</span> {selectedSister.hobbies}</p>
                        <p className="text-sm mb-1"><span className="font-bold text-slate-500">Talentos:</span> {selectedSister.talentos}</p>
                        <p className="text-sm mb-4"><span className="font-bold text-slate-500">Sugerencias:</span> {selectedSister.actividadesSugeridas}</p>
                        
                        <h4 className="font-bold text-slate-800 mb-2 border-b pb-1 mt-6">Social</h4>
                        <p className="text-sm mb-1"><span className="font-bold text-slate-500">Cercana a:</span> {selectedSister.amigasCercanas}</p>
                        <p className="text-sm mb-1"><span className="font-bold text-slate-500">Extraña a:</span> {selectedSister.personasExtraña}</p>
                        <p className="text-sm mb-1"><span className="font-bold text-slate-500">Quiere conocer:</span> {selectedSister.quiereConocer}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">Convenios Realizados</h4>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {selectedSister.bautismo && <Badge color="bg-green-100 text-green-700">Bautismo</Badge>}
                            {selectedSister.confirmacion && <Badge color="bg-green-100 text-green-700">Confirmación</Badge>}
                            {selectedSister.investidura && <Badge color="bg-purple-100 text-purple-700">Investidura</Badge>}
                            {selectedSister.sellamiento && <Badge color="bg-purple-100 text-purple-700">Sellamiento</Badge>}
                        </div>
                        
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                            <h4 className="font-bold text-yellow-800 mb-2">Próxima Meta</h4>
                            <p className="text-lg font-bold">{selectedSister.proximoConvenio || "Sin definir"}</p>
                            <p className="text-sm text-yellow-700">Fecha: {selectedSister.fechaMeta}</p>
                            <p className="text-sm text-yellow-700 mt-2">Seguimiento: {selectedSister.encargadoSeguimiento}</p>
                        </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      {showForm && <SisterForm onSubmit={handleSave} onCancel={() => { setShowForm(false); setSelectedSister(null); }} initialData={selectedSister} />}
    </div>
  );
}