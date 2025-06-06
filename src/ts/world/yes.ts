import {
  MeshBasicMaterial, PerspectiveCamera,
  Scene, ShaderMaterial, WebGLRenderer,
  Raycaster, Vector2
} from "three";
import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls";
import * as dat from 'dat.gui';

// interfaces
import { IWord } from '../interfaces/IWord'

import { Basic } from './Basic'
import Sizes from '../Utils/Sizes'
import { Resources } from './Resources';

// earth 
import Earth from './Earth'
import Data from './Data'

export default class World {
  public basic: Basic;
  public scene: Scene;
  public camera: PerspectiveCamera;
  public renderer: WebGLRenderer
  public controls: OrbitControls;
  public sizes: Sizes;
  public material: ShaderMaterial | MeshBasicMaterial;
  public resources: Resources;
  public option: IWord;
  public earth: Earth;
  private raycaster: Raycaster;
  private mouse: Vector2;
  private gui: dat.GUI;
  private popupParams: {
    showPopup: boolean;
  };

  constructor(option: IWord) {
    /**
     * 加载资源
     */
    this.option = option

    this.basic = new Basic(option.dom)
    this.scene = this.basic.scene
    this.renderer = this.basic.renderer
    this.controls = this.basic.controls
    this.camera = this.basic.camera

    this.sizes = new Sizes({ dom: option.dom })

    this.sizes.$on('resize', () => {
      this.renderer.setSize(Number(this.sizes.viewport.width), Number(this.sizes.viewport.height))
      this.camera.aspect = Number(this.sizes.viewport.width) / Number(this.sizes.viewport.height)
      this.camera.updateProjectionMatrix()
    })

    // 初始化 Raycaster
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();

    // 初始化GUI
    this.popupParams = {
      showPopup: true
    };
    this.gui = new dat.GUI({ width: 150 });
    
    // 添加GUI自定义样式
    const style = document.createElement('style');
    style.innerHTML = `
      .dg.main {
        background: rgba(17, 19, 23, 0.85) !important;
        backdrop-filter: blur(10px) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 16px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      }
      .dg.main .close-button,
      .dg.main .close-button:hover,
      .dg.main .close-button:active,
      .dg.main .close-button:focus,
      .dg.main .close-button:visited {
        display: none !important;
      }
      .dg.main .title {
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 16px 16px 0 0 !important;
        color: rgba(255, 255, 255, 0.9) !important;
        font-weight: 500 !important;
        letter-spacing: 0.5px !important;
        padding: 12px 16px !important;
      }
      .dg.main .folder {
        background: transparent !important;
        border-radius: 12px !important;
        margin: 6px 0 !important;
      }
      .dg.main .folder .title {
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 12px !important;
        color: rgba(255, 255, 255, 0.9) !important;
        padding: 8px 12px !important;
      }
      .dg.main .cr {
        border-radius: 12px !important;
        margin: 6px 0 !important;
        background: rgba(255, 255, 255, 0.03) !important;
        padding: 4px 8px !important;
        transition: all 0.2s ease !important;
      }
      .dg.main .cr:hover {
        background: rgba(255, 255, 255, 0.07) !important;
      }
      .dg.main .cr .property-name {
        color: rgba(255, 255, 255, 0.7) !important;
        font-weight: 400 !important;
        letter-spacing: 0.3px !important;
      }
      .dg.main .cr.number input[type=text] {
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 8px !important;
        color: rgba(255, 255, 255, 0.9) !important;
        padding: 4px 8px !important;
        transition: all 0.2s ease !important;
      }
      .dg.main .cr.number input[type=text]:focus {
        background: rgba(255, 255, 255, 0.08) !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
      }
      .dg.main .cr.boolean {
        border-radius: 12px !important;
      }
      .dg.main .cr.boolean .slider {
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 12px !important;
        transition: all 0.3s ease !important;
      }
      .dg.main .cr.boolean .slider:before {
        background: rgba(255, 255, 255, 0.9) !important;
        border-radius: 12px !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
        transition: all 0.3s ease !important;
      }
      .dg.main .cr.boolean .slider.active {
        background: rgba(100, 200, 255, 0.3) !important;
      }
      .dg.main .cr.boolean .slider.active:before {
        background: rgb(100, 200, 255) !important;
      }
      .dg.main .cr.color .c {
        border-radius: 8px !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
      }
      .dg.main .cr.function {
        background: rgba(100, 200, 255, 0.1) !important;
      }
      .dg.main .cr.function:hover {
        background: rgba(100, 200, 255, 0.15) !important;
      }
      .dg.main .cr.function .property-name {
        color: rgb(100, 200, 255) !important;
      }
    `;
    document.head.appendChild(style);

    this.gui.add(this.popupParams, 'showPopup').name('控制面板').onChange((value) => {
      const infoPopup = document.getElementById('info-popup');
      if (infoPopup) {
        infoPopup.style.display = value ? 'block' : 'none';
      }
    });

    // 添加弹窗DOM
    const infoPopup = document.createElement('div');
    infoPopup.id = 'info-popup';
    infoPopup.style.cssText = `
      position: absolute; 
      z-index: 9999; 
      background: rgba(44, 30, 30, 0.98); 
      color: #fff; 
      padding: 16px 20px 12px 20px; 
      border-radius: 12px; 
      display: none; 
      max-width: 90vw; 
      width: 340px;
      font-size: 15px; 
      line-height: 1.6; 
      pointer-events: auto; 
      box-shadow: 0 8px 32px rgba(0,0,0,0.25); 
      border: 1.5px solid #3fa7ff; 
      transition: all 0.3s ease; 
      word-break: break-all;
      -webkit-overflow-scrolling: touch;
      overflow-y: auto;
      max-height: 80vh;
    `;
    infoPopup.innerHTML = '';
    document.body.appendChild(infoPopup);

    // 添加全局样式（只添加一次）
    if (!document.getElementById('info-popup-style')) {
      const style = document.createElement('style');
      style.id = 'info-popup-style';
      style.innerHTML = `
        @font-face {
          font-family: 'Source Han Sans';
          src: url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');
        }
        @font-face {
          font-family: 'Source Han Serif';
          src: url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&display=swap');
        }
        #info-popup {
          font-family: 'Source Han Serif', 'Noto Serif SC', serif;
        }
        #info-popup ul {margin: 18px 0 0 0; padding: 0; list-style: none;}
        #info-popup li {margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #2a2e3a;}
        #info-popup li:last-child {margin-bottom: 0; border-bottom: none;}
        #info-popup a {color: #4FC3F7; text-decoration: underline; transition: color 0.2s; word-break: break-all;}
        #info-popup a:hover {color: #fff200;}
        #info-popup b {font-family: 'Source Han Sans', 'Noto Sans SC', sans-serif; font-size: 17px;}
        @media (max-width: 600px) {
          #info-popup {max-width: 96vw; font-size: 15px; padding: 14px 8px 10px 12px;}
          #info-popup ul {margin-top: 10px;}
        }
      `;
      document.head.appendChild(style);
    }

    this.resources = new Resources(async () => {
      await this.createEarth()
      // 开始渲染
      this.render()
    })
  }

  async createEarth() {
    // 资源加载完成，开始制作地球，注释在new Earth()类型里面
    this.earth = new Earth({
      data: Data,
      dom: this.option.dom,
      textures: this.resources.textures,
      earth: {
        radius: 50,
        rotateSpeed: 0.002,
        isRotation: false  // 设置为 false 停止地球自转
      },
      satellite: {
        show: true,
        rotateSpeed: -0.01,
        size: 1,
        number: 2
      },
      punctuation: {
        circleColor: 0x3892ff,
        lightColumn: {
          // 透明颜色
          startColor: 0xffff00, // 黄色 
          endColor: 0xffff00,   // 黄色
        },
      },
      flyLine: {
        color: 0xf3ae76, // 飞线的颜色
        flyLineColor: 0xff7714, // 飞行线的颜色
        speed: 0.004, // 拖尾飞线的速度
      }
    })

    this.scene.add(this.earth.group)

    await this.earth.init()

    // 显示所有点的信息
    this.showAllPointsInfo();

    // 隐藏dom
    const loading = document.querySelector('#loading')
    loading.classList.add('out')
  }

  // 显示所有点的信息
  private showAllPointsInfo() {
    const clickablePoints = this.earth?.clickablePoints || [];
    const infoPopup = document.getElementById('info-popup');
    if (!infoPopup) return;

    let allContent = '';
    clickablePoints.forEach((point: any) => {
      if (point.userData && point.userData.coordinates) {
        const { name, companies } = point.userData.coordinates;
        
        // 添加内容
        allContent += `<b style='font-size:18px;color:#3fa7ff;margin-bottom:12px;display:block;font-family:"Source Han Sans","Noto Sans SC",sans-serif;'>${name}</b>`;
        companies.forEach((c: any) => {
          // 验证经纬度是否合法
          if (!c.lon || !c.lat || 
              c.lon < -180 || c.lon > 180 || 
              c.lat < -90 || c.lat > 90) {
            console.warn(`Invalid coordinates for company: ${c.name}`);
            return;
          }

          // 确保经纬度精确到小数点后5位
          const lon = Number(c.lon).toFixed(5);
          const lat = Number(c.lat).toFixed(5);
          
          // 使用高德地图搜索链接格式
          let amapUrl = '';
          if (c.ifMap) {
            amapUrl = `https://ditu.amap.com/search?query=${encodeURIComponent(c.name || '')}&city=${c.city}&geoobj=${lon}%7C${lat}%7C${lon}%7C${lat}&zoom=17`;
          } else {
            amapUrl = c.amapUrl;
          }
          allContent += `
            <a href='${amapUrl}' target='_blank' style='text-decoration:none;display:block;'>
              <div style='position:relative;background:rgba(30,34,44,0.95);border-radius:8px;padding:12px 16px;margin-bottom:12px;border:1px solid #3fa7ff;transition:all 0.3s ease;cursor:pointer;'>
                <b style='font-size:16px;color:#fff;display:block;margin-bottom:8px;font-family:"Source Han Sans","Noto Sans SC",sans-serif;'>${c.name || '未命名'}</b>
                <div style='color:#4FC3F7;font-size:14px;display:flex;align-items:center;font-family:"Source Han Serif","Noto Serif SC",serif;'>
                  <svg width="16" height="20" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:4px;"><path fill="#e53935" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
                  <span>${c.address || '地址未知'}</span>
                </div>
              </div>
            </a>
          `;
        });
      }
    });

    infoPopup.innerHTML = allContent;

    // 设置位置
    infoPopup.style.left = '50%';
    infoPopup.style.top = '70%';
    infoPopup.style.transform = 'translate(-50%, -50%)';
    infoPopup.style.display = 'block';
  }

  /**
   * 渲染函数
   */
  public render() {
    requestAnimationFrame(this.render.bind(this))
    this.renderer.render(this.scene, this.camera)
    this.controls && this.controls.update()
    this.earth && this.earth.render()
  }
}