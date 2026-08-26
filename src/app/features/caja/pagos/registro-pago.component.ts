import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CajaService } from '../../../core/services/caja.service';
import { ClientesService } from '../../../core/services/clientes.service';
import { MembresiasService } from '../../../core/services/membresias.service';
import { ReciboService } from '../../../core/services/recibo.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cliente, Plan, PagoForm } from '../../../core/models';
import { ClientSearchComponent, ClienteBusqueda } from '../../../shared/components/client-search/client-search.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyDopPipe } from '../../../shared/pipes/currency-dop.pipe';

@Component({
  selector: 'app-registro-pago',
  imports: [FormsModule, RouterLink, ClientSearchComponent, StatusBadgeComponent, CurrencyDopPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registro-pago.component.html',
  styleUrl: './registro-pago.component.css',
})
export class RegistroPagoComponent implements OnInit {
  turnoAbierto = signal(false);
  clienteSeleccionado = signal<ClienteBusqueda | null>(null);
  clienteData = signal<Cliente | null>(null);
  planSeleccionado = signal<Plan | null>(null);
  saving = signal(false);
  message = signal('');
  isError = signal(false);
  vincularMembresia = signal(true);
  monto = signal(0);
  concepto = signal('');

  form: PagoForm = { cliente_id: '', monto: 0, metodo: 'efectivo', concepto: '', membresia_id: undefined };

  mostrarAsignarPlan = computed(() => !!this.clienteSeleccionado() && !!this.clienteData() && !this.clienteData()?.membresia_activa);

  cobrarDeshabilitado = computed(() =>
    this.saving() ||
    !this.clienteSeleccionado() ||
    !this.monto() ||
    !this.concepto().trim() ||
    (this.mostrarAsignarPlan() && !this.planSeleccionado())
  );

  constructor(
    private caja: CajaService,
    private clientes: ClientesService,
    public membresias: MembresiasService,
    private reciboService: ReciboService,
    private auth: AuthService,
  ) {}

  async ngOnInit() {
    await Promise.all([
      this.caja.cargarTurnoActual(),
      this.membresias.cargarPlanes(),
    ]);
    this.turnoAbierto.set(this.caja.hayTurnoAbierto());
  }

  async seleccionarCliente(cliente: ClienteBusqueda) {
    this.clienteSeleccionado.set(cliente);
    this.form.cliente_id = cliente.id;
    this.planSeleccionado.set(null);

    const data = await this.clientes.obtener(cliente.id);
    this.clienteData.set(data);

    if (data?.membresia_activa) {
      this.form.membresia_id = this.vincularMembresia() ? data.membresia_activa.id : undefined;
      if (this.vincularMembresia() && data.membresia_activa.plan?.nombre) {
        const nombre = data.membresia_activa.plan.nombre;
        const montoVal = data.membresia_activa.precio_pagado ?? 0;
        this.concepto.set('Pago membresía ' + nombre);
        this.monto.set(montoVal);
        this.form.concepto = this.concepto();
        this.form.monto = montoVal;
      }
    } else {
      this.form.membresia_id = undefined;
      this.concepto.set('');
      this.monto.set(0);
      this.form.concepto = '';
      this.form.monto = 0;
    }
  }

  seleccionarPlan(plan: Plan) {
    this.planSeleccionado.set(plan);
    this.monto.set(plan.precio);
    this.concepto.set('Membresía ' + plan.nombre);
    this.form.monto = plan.precio;
    this.form.concepto = 'Membresía ' + plan.nombre;
  }

  limpiarCliente() {
    this.clienteSeleccionado.set(null);
    this.clienteData.set(null);
    this.planSeleccionado.set(null);
    this.monto.set(0);
    this.concepto.set('');
    this.form = { cliente_id: '', monto: 0, metodo: 'efectivo', concepto: '', membresia_id: undefined };
  }

  async cobrar() {
    if (!this.turnoAbierto() || !this.clienteSeleccionado()) return;
    this.saving.set(true);
    this.message.set('');

    let membresiaId = this.vincularMembresia() ? this.form.membresia_id : undefined;

    const plan = this.planSeleccionado();
    if (plan) {
      const hoy = new Date().toISOString().split('T')[0];
      const { membresiaId: newId, error: membError } = await this.membresias.crearMembresiaParaCobro(
        this.clienteSeleccionado()!.id,
        plan.id,
        hoy,
      );
      if (membError) {
        this.saving.set(false);
        this.isError.set(true);
        this.message.set(membError);
        return;
      }
      membresiaId = newId ?? undefined;
    }

    const payload: PagoForm = {
      ...this.form,
      cliente_id: this.clienteSeleccionado()!.id,
      membresia_id: membresiaId,
    };

    const { error } = await this.caja.registrarPago(payload);
    this.saving.set(false);

    if (error) {
      this.isError.set(true);
      this.message.set(error);
      return;
    }

    this.isError.set(false);
    this.message.set(plan ? 'Membresía asignada y cobro registrado.' : 'Cobro registrado correctamente.');

    const cliente = this.clienteSeleccionado()!;
    const montoFinal = payload.monto;
    const metodoFinal = payload.metodo;
    const conceptoFinal = payload.concepto;
    const usuario = this.auth.usuario();

    await this.reciboService.mostrar({
      tipo: plan ? 'membresia' : 'cobro',
      numero: Date.now().toString(36).toUpperCase(),
      fecha: new Date(),
      clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
      items: [{ descripcion: conceptoFinal, precio: montoFinal }],
      total: montoFinal,
      metodo: metodoFinal,
      cajero: usuario?.nombre ?? '',
    });

    this.clienteSeleccionado.set(null);
    this.clienteData.set(null);
    this.planSeleccionado.set(null);
    this.monto.set(0);
    this.concepto.set('');
    this.vincularMembresia.set(true);
    this.form = { cliente_id: '', monto: 0, metodo: 'efectivo', concepto: '', membresia_id: undefined };
  }
}
