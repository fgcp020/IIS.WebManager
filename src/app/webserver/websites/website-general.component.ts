import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Selector } from 'common/selector';
import { ApiFile } from 'files/file';
import { WebSite } from './site';
import { AppPoolListComponent } from '../app-pools/app-pool-list.component';


@Component({
    selector: 'website-general',
    template: `
        <tabs>
            <tab [name]="'Settings'">
                <fieldset>
                    <label>Name</label>
                    <input class="form-control name" type="text" [(ngModel)]="site.name" throttle (modelChanged)="onModelChanged()" required/>
                </fieldset>
                <fieldset class="path">
                    <label>Physical Path</label>
                    <input type="text" class="form-control left-with-button" [(ngModel)]="site.physical_path" (modelChanged)="onModelChanged()" throttle required />
                    <button title="Select Folder" [class.background-active]="fileSelector.isOpen()" class="select" (click)="fileSelector.toggle()"></button>
                    <server-file-selector #fileSelector [types]="['directory']" [defaultPath]="site.physical_path" (selected)="onSelectPath($event)"></server-file-selector>
                </fieldset>
                <fieldset>
                    <switch label="Auto Start" class="block" [(model)]="site.server_auto_start" (modelChanged)="onModelChanged()">{{site.server_auto_start ? "On" : "Off"}}</switch>
                </fieldset>
                <fieldset class="inline-block">
                    <switch label="Custom Protocols" class="block" [(model)]="custom_protocols" (modelChange)="useCustomProtocols($event)">{{custom_protocols ? "On" : "Off"}}</switch>
                </fieldset>
                <fieldset class="inline-block" *ngIf="custom_protocols">
                    <label>Protocols</label>
                    <input class="form-control" type="text" [(ngModel)]="site.enabled_protocols" (modelChanged)="onModelChanged()" required throttle />
                </fieldset>
            </tab>
            <tab [name]="'Bindings'">
                <binding-list *ngIf="site.bindings" [(model)]="site.bindings" (modelChange)="onModelChanged()"></binding-list>
            </tab>
            <tab [name]="'Limits'">
                <limits [model]="site.limits" (modelChanged)="onModelChanged()"></limits>
            </tab>
            <tab [name]="'Application Pool'">
                <button [class.background-active]="poolSelect.opened" (click)="selectAppPool()">Change Application Pool <i class="fa fa-caret-down"></i></button>
                <selector #poolSelect class="container-fluid create">
                    <app-pools #appPools [listingOnly]="true" [lazy]="true" (itemSelected)="onAppPoolSelected($event)"></app-pools>
                </selector>
                <app-pool-details [model]="site.application_pool"></app-pool-details>
            </tab>
        </tabs>
    `
})
export class WebSiteGeneralComponent {
    @Input() site: WebSite;
    @Output() modelChanged: EventEmitter<any> = new EventEmitter();

    @ViewChild('poolSelect') poolSelect: Selector;
    @ViewChild('appPools') appPools: AppPoolListComponent;
    @ViewChildren(NgModel) validators: QueryList<NgModel>;

    custom_protocols: boolean;

    ngOnInit() {
        this.custom_protocols = !(this.site.enabled_protocols.toLowerCase() == "http" ||
                                  this.site.enabled_protocols.toLowerCase() == "https");
    }

    onModelChanged() {
        if (this.isValid()) {

            // Bubble up model changed event to parent
            this.modelChanged.emit(null);
        }
    }

    isValid() {

        // Check all validators provided by ngModel
        if (this.validators) {
            let vs = this.validators.toArray();
            for (var control of vs) {
                if (!control.valid) {
                    return false;
                }
            }
        }

        return true;
    }

    selectAppPool() {
        this.poolSelect.toggle();

        if (this.poolSelect.opened) {
            this.appPools.activate();
        }
    }

    onAppPoolSelected(pool) {
        this.poolSelect.close();

        if (this.site.application_pool && this.site.application_pool.id == pool.id) {
            return;
        }

        this.site.application_pool = pool;

        this.onModelChanged();
    }

    useCustomProtocols(value: boolean) {
        if (!value) {
            this.site.enabled_protocols = "http";
            this.onModelChanged();
        }
    }

    private onSelectPath(event: Array<ApiFile>) {
        if (event.length == 1) {
            this.site.physical_path = event[0].physical_path;
            this.onModelChanged();
        }
    }
}
