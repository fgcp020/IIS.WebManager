import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrderBy, SortPipe } from '../../common/sort.pipe';
import { Range } from '../../common/virtual-list.component';
import { ApiFile } from '../../files/file';
import { LoggingService } from './logging.service';


@Component({
    selector: 'log-files',
    template: `
        <toolbar
            [refresh]="true"
            [delete]="_selected.length > 0"
            (onRefresh)="onRefresh()"
            (onDelete)="onDelete()"></toolbar>
        <div tabindex="-1" class="wrapper"
                        [selectable]="_logs"
                        [selected]="_selected"
                        (keyup.delete)="onDelete()">
            <input tabindex="-1" class="out" type="text"/>
            <div class="container-fluid">
                <div class="hidden-xs border-active grid-list-header row">
                    <label class="col-xs-8 col-sm-5 col-lg-4 hidden-xs" [ngClass]="_orderBy.css('name')" (click)="sort('name')"
                        tabindex="0" aria-label="Name Header" role="button" (keyup.enter)="sort('name')" (keyup.space)="sort('name')">Name</label>
                    <label class="col-sm-3 col-md-2 hidden-xs" [ngClass]="_orderBy.css('last_modified')" (click)="sort('last_modified')"
                        tabindex="0" aria-label="Last Modified Header" role="button" (keyup.enter)="sort('last_modified')" (keyup.space)="sort('last_modified')">Last Modified</label>
                    <label class="col-md-2 visible-lg visible-md" [ngClass]="_orderBy.css('description')" (click)="sort('description')"
                        tabindex="0" aria-label="Type Header" role="button" (keyup.enter)="sort('description')" (keyup.space)="sort('description')">Type</label>
                    <label class="col-md-1 visible-lg visible-md text-right" [ngClass]="_orderBy.css('size')" (click)="sort('size')"
                        tabindex="0" aria-label="Size Header" role="button" (keyup.enter)="sort('size')" (keyup.space)="sort('size')">Size</label>
                </div>
            </div>
            <virtual-list class="container-fluid grid-list"
                        *ngIf="!!_logs"
                        [count]="_logs.length"
                        (rangeChange)="onRangeChange($event)">
                <li class="hover-editing" 
                    tabindex="-1" 
                    *ngFor="let child of _view">
                    <log-file [model]="child"></log-file>
                </li>
            </virtual-list>
        </div>
    `,
    styles: [`
        .container-fluid,
        .row {
            margin: 0;
            padding: 0;
        }

        .wrapper {
            min-height: 50vh;
        }

        .out {
            position: absolute; 
            left: -1000px;
        }
    `]
})
export class LogFilesComponent implements OnInit, OnDestroy {
    private _orderBy: OrderBy = new OrderBy();
    private _sortPipe: SortPipe = new SortPipe();
    private _subscriptions: Array<Subscription> = [];
    private _range: Range = new Range(0, 0);
    private _logs: Array<ApiFile>;
    private _view: Array<ApiFile> = [];
    private _selected: Array<ApiFile> = [];

    constructor(private _service: LoggingService) {
        this._subscriptions.push(this._service.logs.subscribe(t => {
            this._logs = t;
            this.doSort();
        }));
    }

    public ngOnInit() {
        this._orderBy.sortDesc('last_modified');
        this.onRefresh();
    }

    public ngOnDestroy() {
        for (let sub of this._subscriptions) {
            sub.unsubscribe();
        }
    }

    private onRefresh() {
        this._logs = [];
        this._service.loadLogs();
    }

    private onDelete() {
        let msg = this._selected.length == 1 ? "Are you sure you want to delete '" + this._selected[0].name + "'?" :
            "Are you sure you want to delete " + this._selected.length + " items?";

        if (confirm(msg)) {
            this._service.delete(this._selected);
        }
    }

    private sort(field: string) {
        this._orderBy.sort(field, false);
        this.doSort();
    }

    private doSort() {
        this._logs = this._sortPipe.transform(this._logs, this._orderBy.Field, this._orderBy.Asc);
        this.onRangeChange(this._range);
    }

    private onRangeChange(range: Range) {
        this._view.splice(0);

        let end = range.start + range.length < this._logs.length ? range.start + range.length : this._logs.length;

        for (let i = range.start; i < end; i++) {
            this._view.push(this._logs[i]);
        }

        this._range = range;
    }
}
