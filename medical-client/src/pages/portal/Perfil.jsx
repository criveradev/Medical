import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, ShieldCheck, CheckCircle2, Camera, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Btn, Field, ErrorMsg, Spinner, Badge, PasswordInput } from '../../components/ui';
import { rolInfo } from '../../lib/roles';

/**
 * Redimensiona una imagen en el navegador a un cuadrado de máx. `max` px (JPEG),
 * para que el avatar pese poco sin importar el tamaño original.
 * @param {File} file - Archivo de imagen original.
 * @param {number} [max=512] - Lado máximo en píxeles.
 * @returns {Promise<Blob>} Blob JPEG redimensionado.
 */
function redimensionar(file, max = 512) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > height && width > max) { height = Math.round((height * max) / width); width = max; }
      else if (height >= width && height > max) { width = Math.round((width * max) / height); height = max; }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagen inválida')); };
    img.src = url;
  });
}

/**
 * Fila de dato del perfil con icono, etiqueta y valor.
 * @param {{icon: import('react').ComponentType, label: string, valor?: string}} props
 * @returns {JSX.Element}
 */
function Dato({ icon: Icon, label, valor }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon size={17} />
      </span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800">{valor || '—'}</p>
      </div>
    </div>
  );
}

/**
 * Página de perfil del usuario autenticado: muestra sus datos, permite subir/
 * cambiar la foto de perfil y cerrar sesión.
 * @returns {JSX.Element}
 */
export default function Perfil() {
  const { logout, actualizarFoto } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch('/api/auth/perfil');

  const [foto, setFoto] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirma, setConfirma] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [proc, setProc] = useState(false);

  async function cambiar(e) {
    e.preventDefault();
    setErr('');
    if (nueva !== confirma) { setErr('Las contraseñas nuevas no coinciden.'); return; }
    if (nueva.length < 8 || !/[A-Za-z]/.test(nueva) || !/\d/.test(nueva)) {
      setErr('La nueva contraseña debe tener mínimo 8 caracteres, con letras y números.');
      return;
    }
    setProc(true);
    try {
      await api.put('/api/auth/cambiar-password', { passwordActual: actual, passwordNueva: nueva });
      setOk(true);
      // El backend invalida la sesión → cerrar y volver a entrar
      setTimeout(() => { logout(); navigate('/login', { replace: true }); }, 1500);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setProc(false);
    }
  }

  async function onFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoFoto(true);
    try {
      const blob = await redimensionar(file, 512);
      const fd = new FormData();
      fd.append('foto', blob, 'avatar.jpg');
      const res = await api.upload('/api/auth/perfil/foto', fd, 'PUT');
      setFoto(res.foto);
      actualizarFoto(res.foto);
      toast.success('Foto actualizada');
    } catch (e2) {
      toast.error(e2.message);
    } finally {
      setSubiendoFoto(false);
    }
  }

  if (loading) return <><PageHeader title="Mi perfil" /><Spinner /></>;
  if (error) return <><PageHeader title="Mi perfil" /><ErrorMsg>{error}</ErrorMsg></>;

  const u = data?.usuario || {};
  const rol = data?.rol?.nombre || u.roleId?.nombre;
  const info = rolInfo[rol] || { label: rol, color: 'slate' };
  const iniciales = (u.nombre?.[0] || '') + (u.apellido?.[0] || '');
  const fotoActual = foto || u.foto;

  return (
    <>
      <PageHeader title="Mi perfil" subtitle="Tus datos y seguridad de la cuenta." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer" title="Cambiar foto">
              {fotoActual ? (
                <img src={fotoActual} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
                  {iniciales}
                </span>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white ring-2 ring-white">
                {subiendoFoto ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={onFoto} disabled={subiendoFoto} />
            </label>
            <div>
              <p className="text-lg font-semibold text-slate-900">{u.nombre} {u.apellido}</p>
              <Badge color={info.color}>{info.label}</Badge>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-2">
            <Dato icon={Mail} label="Correo" valor={u.email} />
            <Dato icon={Phone} label="Teléfono" valor={u.telefono} />
            <Dato icon={ShieldCheck} label="Rol" valor={info.label} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-slate-900">Cambiar contraseña</h2>
          <p className="mt-1 text-sm text-slate-500">Por seguridad, deberás iniciar sesión de nuevo al cambiarla.</p>

          {ok ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
              <CheckCircle2 size={16} /> Contraseña actualizada. Redirigiendo al inicio de sesión…
            </div>
          ) : (
            <form onSubmit={cambiar} className="mt-4 space-y-4">
              <ErrorMsg>{err}</ErrorMsg>
              <Field label="Contraseña actual">
                <PasswordInput value={actual} onChange={(e) => setActual(e.target.value)} required autoComplete="current-password" />
              </Field>
              <Field label="Nueva contraseña" hint="Mín. 8, con letras y números">
                <PasswordInput value={nueva} onChange={(e) => setNueva(e.target.value)} required autoComplete="new-password" />
              </Field>
              <Field label="Repetir nueva contraseña">
                <PasswordInput value={confirma} onChange={(e) => setConfirma(e.target.value)} required autoComplete="new-password" />
              </Field>
              <div className="flex justify-end pt-1">
                <Btn type="submit" disabled={proc}>{proc ? 'Guardando…' : 'Actualizar contraseña'}</Btn>
              </div>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
