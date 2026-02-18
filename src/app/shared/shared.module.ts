import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
    BsDatepickerModule,
    BsDatepickerConfig,
} from 'ngx-bootstrap/datepicker';
import { CustomPaginationModule } from './custom-pagination/custom-pagination.module';
import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MaterialModule } from './material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxEditorModule } from 'ngx-editor';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { LightgalleryModule } from 'lightgallery/angular';
import { FullCalendarModule } from '@fullcalendar/angular';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { NgxMaskModule } from 'ngx-mask';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { NgChartsModule } from 'ng2-charts';
import { LightboxModule } from 'ngx-lightbox';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { BsDaterangepickerConfig } from 'ngx-bootstrap/datepicker';
import { DateRangePickerModule } from './common/date-range-picker/date-range-picker.module';
import { CollapseHeaderModule } from './common/collapse-header/collapse-header.module';
import { ReloadComponent } from './components/reload/reload.component';
import { UserGetComponent } from './components/user-get/user-get.component';
import { HelpTooltipComponent } from './components/help-tooltip/help-tooltip.component';
import { SmartFieldComponent } from './components/smart-field/smart-field.component';
import { UserFriendlyTooltipDirective } from './directives/user-friendly-tooltip.directive';
import { UserFriendlyFormsService } from './services/user-friendly-forms.service';
import { PwaInstallDialogComponent } from './pwa-install-dialog/pwa-install-dialog.component';


@NgModule({
    declarations: [
        UserGetComponent,
        PwaInstallDialogComponent,
    ],
    exports: [
        CommonModule,
        NgScrollbarModule,
        NgApexchartsModule,
        BsDatepickerModule,
        CustomPaginationModule,
        HttpClientModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        BsDatepickerModule,
        NgxEditorModule,
        // MultiSelectModule,
        CollapseHeaderModule,
        CarouselModule,
        LightgalleryModule,
        FullCalendarModule,
        // ToastModule,
        TooltipModule,
        PopoverModule,
        NgxMaskModule,
        NgxDropzoneModule,
        NgChartsModule,
        LightboxModule,
        // ChipsModule,
        // EditorModule,
        DateRangePickerModule,
        // DropdownModule,
        TimepickerModule,
        NgxMatTimepickerModule,
        UserGetComponent,
        ReloadComponent,
        HelpTooltipComponent,
        SmartFieldComponent,
        UserFriendlyTooltipDirective,
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        NgScrollbarModule,
        NgApexchartsModule,
        BsDatepickerModule.forRoot(),
        CustomPaginationModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        NgxEditorModule,
        CollapseHeaderModule,
        CarouselModule,
        LightgalleryModule,
        FullCalendarModule,
        TooltipModule,
        PopoverModule,
        NgxDropzoneModule,
        NgChartsModule.forRoot(),
        LightboxModule,
        DateRangePickerModule,
        TimepickerModule.forRoot(),
        NgxMatTimepickerModule,
        HelpTooltipComponent,
        SmartFieldComponent,
        UserFriendlyTooltipDirective,
        ReloadComponent
    ],
    providers: [
        BsDatepickerConfig,
        DatePipe,
        BsDaterangepickerConfig,
        UserFriendlyFormsService,
        provideHttpClient(withInterceptorsFromDi())
    ]
})
export class SharedModule { }
