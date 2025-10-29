import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateRfidModeDto } from './dto/rfid-mode.dto';
import { VoiceActionDto } from './dto/voice-action.dto';
import { VoiceCommandDto } from './dto/voice-command.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  private buildResponse(message: string, data: unknown = {}) {
    return { message, data };
  }

  @Get('home')
  async getHome() {
    const data = await this.inventoryService.getHomeSummary();
    return this.buildResponse('Resumen general del inventario', data);
  }

  @Get('products')
  async getProducts() {
    const products = await this.inventoryService.getProducts();
    return this.buildResponse('Lista de productos activos', { products });
  }

  @Get('products/:id')
  async getProductById(@Param('id') id: string) {
    const product = await this.inventoryService.getProductById(id);
    return this.buildResponse('Detalle del producto', { product });
  }

  @Post('products')
  async createProduct(@Body() dto: CreateProductDto) {
    const product = await this.inventoryService.createProduct(dto);
    return this.buildResponse('Producto creado correctamente', { product });
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = await this.inventoryService.updateProduct(id, dto);
    return this.buildResponse('Producto actualizado correctamente', { product });
  }

  @Delete('products/:id')
  async deactivateProduct(@Param('id') id: string) {
    const product = await this.inventoryService.deactivateProduct(id);
    return this.buildResponse('Producto desactivado correctamente', { product });
  }

  @Get('products/search')
  async searchProducts(@Query('query') query: string) {
    const products = await this.inventoryService.searchProducts(query ?? '');
    return this.buildResponse('Resultados de la búsqueda', { products });
  }

  @Get('products/general')
  async getGeneralStats() {
    const data = await this.inventoryService.getGeneralStats();
    return this.buildResponse('Estadísticas generales del inventario', data);
  }

  @Patch('rfid-mode')
  async setRfidMode(@Body() dto: UpdateRfidModeDto) {
    const entryMode = this.inventoryService.setRfidMode(dto.entry_mode);
    const message = entryMode ? 'Modo entrada activado' : 'Modo entrada desactivado';
    return this.buildResponse(message, { entry_mode: entryMode });
  }

  @Get('rfid-mode')
  getRfidMode() {
    const entryMode = this.inventoryService.getRfidMode();
    return this.buildResponse('Estado del modo RFID', { entry_mode: entryMode });
  }

  @Post('voice-command')
  async handleVoiceCommand(@Body() dto: VoiceCommandDto) {
    const data = this.inventoryService.acknowledgeVoiceCommand(dto.command);
    return this.buildResponse('Comando recibido', data);
  }

  @Post('voice-to-action')
  async executeVoiceAction(@Body() dto: VoiceActionDto) {
    const data = this.inventoryService.executeVoiceAction(dto.productId, dto.action);
    return this.buildResponse('Acción ejecutada correctamente', data);
  }

  @Get('health')
  getHealth() {
    return this.buildResponse('Estado del servicio', { status: 'ok' });
  }
}
