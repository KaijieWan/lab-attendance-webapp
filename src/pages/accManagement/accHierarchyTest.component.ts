import { DatePipe } from '@angular/common';
import {FormGroup, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
import {
  DiagramComponent,
  LineDistribution,
} from '@syncfusion/ej2-angular-diagrams';

import {
  NodeModel,
  ConnectorModel,
  DiagramTools,
  Diagram,
  DataBinding,
  ComplexHierarchicalTree,
  SnapConstraints,
  SnapSettingsModel,
  LayoutModel,
  LayoutOrientation,
  ConnectionPointOrigin,
  IDropEventArgs,
  NodeConstraints,
} from '@syncfusion/ej2-diagrams';
import { DataManager } from '@syncfusion/ej2-data';
import { DiagramModule } from '@syncfusion/ej2-angular-diagrams';
import { ChangeEventArgs as NumericChangeEventArgs } from '@syncfusion/ej2-inputs';
import { ChangeEventArgs as CheckBoxChangeEventArgs } from '@syncfusion/ej2-buttons';
import { RolePermissionService } from '../../service/rolePermission.service';
import { finalize } from 'rxjs';
Diagram.Inject(DataBinding, ComplexHierarchicalTree, LineDistribution);

export interface DataInfo {
  [key: string]: string;
}

export interface RoleDTO{
  role: string;
  reportsTo: string;
  fillColor: string;
  border: string;
}

@Component({
  selector: 'app-accHierarchy-page',
  standalone: true,
  templateUrl: './accHierarchy.component.html',
  encapsulation: ViewEncapsulation.None,

  imports: [ReactiveFormsModule, RouterOutlet, DatePipe, DiagramModule],
  styleUrl: './accHierarchy.component.scss'
})

export class AccHierarchyComponent {
  @ViewChild('diagram')
  public diagram!: DiagramComponent;
  distinctRoles: RoleDTO[] = [];

  constructor(private rolePermissionService: RolePermissionService){
  }

  ngOnInit(){
    this.rolePermissionService.getDistinctRoles().pipe(
      finalize(() => {
        this.distinctRoles.forEach(item => {
          this.rolePermissionService.getRolePermissions(item.role).subscribe({
            next: (response) => {
              //console.log(response);
              item.reportsTo = response[0].reportsTo ? response[0].reportsTo.split(',') : null;
            }
          })
        })
        console.log('distinctRoles after processing:', this.distinctRoles);
        //this.updateDataSource();
      })      
    ).subscribe({
      next: (response: string[]) => {
        this.distinctRoles= response.map(roleName => ({
          role: roleName,
          reportsTo: "",
          fillColor: "#efd46e",
          border: "#d6b123"
        }));
        console.log('distinctRoles updated from response:', this.distinctRoles);
      }
    })
  }

  /*public mockData: Object[] = [
    {
      Name: 'professor',
      ReportingPerson: ['course-coordinator'],
      fillColor: '#efd46e',
      border: '#d6b123',
    },
    {
      Name: 'college-admin',
      ReportingPerson: ['super-admin'],
      fillColor: '#efd46e',
      border: '#d6b123',
    },
    {
      Name: 'software-lab-manager',
      ReportingPerson: ['super-admin'],
      fillColor: '#efd46e',
      border: '#d6b123',
    },
    {
      Name: 'hardware-lab-manager',
      ReportingPerson: ['super-admin'],
      fillColor: '#efd46e',
      border: '#d6b123',
    },
    {
      Name: 'student_assistant',
      ReportingPerson: ['professor', 'teaching-assistant'],
      fillColor: '#efd46e',
      border: '#d6b123',
    },
    {
      Name: 'super-admin',
      ReportingPerson: [],
      fillColor: '#efd46e',
    },
    {
      Name: 'teaching-assistant',
      ReportingPerson: ['professor'],
      fillColor: '#efd46e',
      border: '#d6b123',
    },
    {
      Name: 'lab-executive',
      ReportingPerson: ['software-lab-manager'],
      fillColor: '#efd46e',
      border: '#d6b123',
    },
    {
      Name: 'course-coordinator',
      ReportingPerson: ['software-lab-manager', 'hardware-lab-manager'],
      fillColor: '#efd46e',
      border: '#d6b123',
    },
  ]

  public Data: any = [
    { Name: 'node11', fillColor: '#e7704c', border: '#c15433' },
    {
      Name: 'node12',
      ReportingPerson: ['node114'],
      fillColor: '#efd46e',
      border: '#d6b123',
    },
    {
      Name: 'node13',
      ReportingPerson: ['node12'],
      fillColor: '#58b087',
      border: '#16955e',
    },
    {
      Name: 'node14',
      ReportingPerson: ['node12'],
      fillColor: '#58b087',
      border: '#16955e',
    },
    {
      Name: 'node15',
      ReportingPerson: ['node12'],
      fillColor: '#58b087',
      border: '#16955e',
    },
    {
      Name: 'node116',
      ReportingPerson: ['node22', 'node12'],
      fillColor: '#58b087',
      border: '#16955e',
    },
    { Name: 'node16', ReportingPerson: [], fillColor: '#14ad85' },
    {
      Name: 'node17',
      ReportingPerson: ['node13', 'node14', 'node15'],
      fillColor: '#659be5',
      border: '#3a6eb5',
    },
    { Name: 'node18', ReportingPerson: [], fillColor: '#14ad85' },
    {
      Name: 'node19',
      ReportingPerson: ['node16', 'node17', 'node18'],
      fillColor: '#8dbe6c',
      border: '#489911',
    },
    {
      Name: 'node110',
      ReportingPerson: ['node16', 'node17', 'node18'],
      fillColor: '#8dbe6c',
      border: '#489911',
    },
    {
      Name: 'node111',
      ReportingPerson: ['node16', 'node17', 'node18', 'node116'],
      fillColor: '#8dbe6c',
      border: '#489911',
    },
    { Name: 'node21', fillColor: '#e7704c', border: '#c15433' },
    {
      Name: 'node22',
      ReportingPerson: ['node114'],
      fillColor: '#efd46e',
      border: '#d6b123',
    },
    {
      Name: 'node23',
      ReportingPerson: ['node22'],
      fillColor: '#58b087',
      border: '#16955e',
    },
    {
      Name: 'node24',
      ReportingPerson: ['node22'],
      fillColor: '#58b087',
      border: '#16955e',
    },
    {
      Name: 'node25',
      ReportingPerson: ['node22'],
      fillColor: '#58b087',
      border: '#16955e',
    },
    { Name: 'node26', ReportingPerson: [], fillColor: '#14ad85' },
    {
      Name: 'node27',
      ReportingPerson: ['node23', 'node24', 'node25'],
      fillColor: '#659be5',
      border: '#3a6eb5',
    },
    { Name: 'node28', ReportingPerson: [], fillColor: '#14ad85' },
    {
      Name: 'node29',
      ReportingPerson: ['node26', 'node27', 'node28', 'node116'],
      fillColor: '#8dbe6c',
      border: '#489911',
    },
    {
      Name: 'node210',
      ReportingPerson: ['node26', 'node27', 'node28'],
      fillColor: '#8dbe6c',
      border: '#489911',
    },
    {
      Name: 'node211',
      ReportingPerson: ['node26', 'node27', 'node28'],
      fillColor: '#8dbe6c',
      border: '#489911',
    },
    { Name: 'node31', fillColor: '#e7704c', border: '#c15433' },
    {
      Name: 'node114',
      ReportingPerson: ['node11', 'node21', 'node31'],
      fillColor: '#f3904a',
      border: '#d3722e',
    },
  ];

  public nodeDefaults(obj: NodeModel): NodeModel {
    obj.width = 130;
    obj.height = 40;
    obj.constraints = NodeConstraints.Default | NodeConstraints.AllowDrop;
    //Initialize shape.
    obj.shape = { type: 'Basic', shape: 'Rectangle', cornerRadius: 7 };
    obj.expandIcon = {
      shape: 'Minus',
    };
    obj.collapseIcon = {
      shape: 'Plus',
    };

    return obj;
  }
  

  updateDataSource() {
    if (this.diagram) {
      console.log('Diagram initialized, setting data source...');
      this.diagram.dataSourceSettings = {
        id: 'role',
        parentId: 'reportsTo',
        dataSource: new DataManager(this.distinctRoles),
        doBinding: (nodeModel: NodeModel, data: DataInfo, diagram: Diagram) => {
          nodeModel.style = {
            fill: data['fillColor'],
            strokeWidth: 1,
            strokeColor: data['border'],
          };
          nodeModel.annotations = [
            {
              content: data['role'],
              style: { color: 'black', fontSize: 12 },
              offset: { x: 0.5, y: 0.5 },
            }
          ];
        }
      };
  
      console.log('Data source settings applied:', this.diagram.dataSourceSettings);
      this.diagram.refresh(); // Force update
    } else {
      console.log('Diagram is not initialized yet.');
    }

  }

  public data: Object = {
    id: 'role',
    parentId: 'reportsTo',
    dataManager: new DataManager(this.mockData as JSON[]),
    //dataSource: new DataManager(this.mockData),
    //Binds the external data with the node.
    doBinding: (nodeModel: NodeModel, data: object, diagram: Diagram) => {
      /* tslint:disable:no-string-literal */
      /*nodeModel.style = {
        fill: data['fillColor'],
        strokeWidth: 1,
        strokeColor: data['border'],
      };

      // Add label using 'Name' property
      nodeModel.annotations = [
        {
          content: (data as RoleDTO).role, // Display the node's Name property
          style: { color: 'black', fontSize: 12 }, // Text styling
          offset: { x: 0.5, y: 0.5 }, // Center text inside node
        }
      ];
    },
  };
  

  public created(): void {
    this.diagram.fitToPage();
  }
  

  public connDefaults(connector: ConnectorModel): void {
    connector.type = 'Orthogonal';
    connector.cornerRadius = 7;

    if(connector.targetDecorator){
      connector.targetDecorator.height = 7;
      connector.targetDecorator.width = 7;
    }

    if(connector.style){
      connector.style.strokeColor = '#6d6d6d';
    }
    
  }

  public tool: DiagramTools = DiagramTools.SingleSelect | DiagramTools.ZoomPan;

  public snapSettings: SnapSettingsModel = {
    constraints: SnapConstraints.None,
  };
  
  public layout: LayoutModel = {
    type: 'ComplexHierarchicalTree',
    connectionPointOrigin: ConnectionPointOrigin.DifferentPoint,
    horizontalSpacing: 70,
    verticalSpacing: 70,
    orientation: 'TopToBottom',
    margin: { left: 10, right: 0, top: 50, bottom: 0 },
  };*/

  public drop(args: IDropEventArgs) {
    //Argument element is used to get the dropped node.
    let node: NodeModel = args.element as NodeModel;
    //Gets the connector that connected to dropped node.
    let edges: string[] = this.diagram.getEdges(node);
    let connector: ConnectorModel = this.diagram.getObject(edges[0]);
    //Argument target is used to get the hovered node.
    connector.sourceID = (args.target as NodeModel).id;
    this.diagram.dataBind();
    // doLayout is used to rearrange the nodes and connectors in the diagram.
    this.diagram.doLayout();
  }

}