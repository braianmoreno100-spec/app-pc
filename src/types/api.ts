export interface Lider {
  cedula: string;
  nombre: string;
  activo: boolean;
}

export interface Empleado {
  cedula: string;
  nombre: string;
  activo: boolean;
}

export interface Producto {
  codigo: string;
  descripcion: string;
  ciclos: number;
  cavidades: number;
  material: string;
  activo: boolean;
}

export interface Orden {
  id?: number;
  numero_orden: string;
  codigo_producto: string;
  descripcion_producto: string;
  cantidad_producir: number;
  material: string;
  tipo_maquina: 'inyeccion' | 'soplado' | 'linea';
  numero_maquina: string;
  cavidades: number;
  ciclos: number;
  tiene_pigmento: boolean;
  numero_pigmento: string;
  descripcion_pigmento: string;
  cedula_lider: string;
  nombre_lider: string;
  fecha_creacion: string;
  activa: boolean;
}

export interface Turno {
  id?: number;
  orden_id: number;
  cedula_empleado: string;
  nombre_empleado: string;
  fecha: string;
  turno: 'A' | 'B' | 'C';
  hora_inicio: string;
  hora_fin?: string;
}

export interface RegistroProduccion {
  id?: number;
  turno_id: number;
  hora: string;
  cantidad: number;
}

export interface Parada {
  id?: number;
  turno_id: number;
  codigo: string;
  descripcion: string;
  minutos: number;
  programada: boolean;
}

export interface Desperdicio {
  id?: number;
  turno_id: number;
  codigo: string;
  defecto: string;
  cantidad: number;
}

export interface Relevo {
  id?: number;
  turno_id: number;
  cedula_empleado: string;
  nombre_empleado: string;
  hora_inicio: string;
  hora_fin?: string;
}

export interface CausaParada {
  id?: number;
  codigo: string;
  descripcion: string;
  programada: boolean;
  tipo_maquina: 'inyeccion' | 'soplado' | 'linea';
  activa: boolean;
}

export interface TiposDesperdicio {
  id?: number;
  codigo: string;
  descripcion: string;
  activa: boolean;
}

export interface ResumenTurno {
  id: number;
  estado: 'abierto' | 'cerrado';
  oee: number;
  // Agregar más KPIs del contexto
}

// Response types para API
export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type OeeColor = 'rojo' | 'naranja' | 'amarillo' | 'verde' | 'azul';


