import {
  MeshBasicMaterial, PerspectiveCamera,
  Scene, ShaderMaterial, WebGLRenderer,
  Raycaster, Vector2
} from "three";
import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls";

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

    // 添加点击事件监听
    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
    // 添加触摸事件监听（移动端）
    this.renderer.domElement.addEventListener('touchend', this.onMouseClick.bind(this));

    // 添加弹窗DOM
    const infoPopup = document.createElement('div');
    infoPopup.id = 'info-popup';
    infoPopup.style.cssText = `
      position: absolute; z-index: 9999; background: rgba(30,34,44,0.98); color: #fff; padding: 20px 24px 16px 24px; border-radius: 12px; display: none; max-width: 340px; font-size: 16px; line-height: 1.7; pointer-events: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.25); border: 1.5px solid #3fa7ff; transition: box-shadow 0.2s; word-break: break-all;`;
    infoPopup.innerHTML = '';
    document.body.appendChild(infoPopup);
    // 添加关闭按钮
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position:absolute;top:10px;right:16px;font-size:22px;cursor:pointer;color:#aaa;transition:color 0.2s;z-index:2;';
    closeBtn.onmouseenter = () => closeBtn.style.color = '#fff';
    closeBtn.onmouseleave = () => closeBtn.style.color = '#aaa';
    closeBtn.onclick = (e) => { infoPopup.style.display = 'none'; e.stopPropagation(); };
    infoPopup.appendChild(closeBtn);
    // 点击空白关闭弹窗
    window.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id !== 'info-popup' && (e.target as HTMLElement) !== closeBtn) {
        infoPopup.style.display = 'none';
      }
    });
    // 添加全局样式（只添加一次）
    if (!document.getElementById('info-popup-style')) {
      const style = document.createElement('style');
      style.id = 'info-popup-style';
      style.innerHTML = `
        #info-popup ul {margin: 18px 0 0 0; padding: 0; list-style: none;}
        #info-popup li {margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #2a2e3a;}
        #info-popup li:last-child {margin-bottom: 0; border-bottom: none;}
        #info-popup a {color: #4FC3F7; text-decoration: underline; transition: color 0.2s; word-break: break-all;}
        #info-popup a:hover {color: #fff200;}
        #info-popup b {font-size: 17px;}
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

  // 处理鼠标点击和触摸事件
  private onMouseClick(event: MouseEvent | TouchEvent) {
    let clientX: number, clientY: number;
    if (event instanceof TouchEvent) {
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else {
      clientX = (event as MouseEvent).clientX;
      clientY = (event as MouseEvent).clientY;
    }
    this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    // 更新射线
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 只检测可点击的点
    const clickablePoints = this.earth?.clickablePoints || [];
    const intersects = this.raycaster.intersectObjects(clickablePoints, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      if (clickedObject.userData && clickedObject.userData.coordinates) {
        const { name, companies } = clickedObject.userData.coordinates;
        // 弹窗显示公司列表
        let html = `<b style='font-size:20px;'>${name}</b><ul>`;
        companies.forEach((c: any) => {
          const amapUrl = `https://uri.amap.com/marker?position=${c.lon},${c.lat}&name=${encodeURIComponent(c.name)}`;
          html += `<li><b>${c.name}</b><br><a href='${amapUrl}' target='_blank'>${c.address}</a></li>`;
        });
        html += '</ul>';
        const infoPopup = document.getElementById('info-popup');
        // 保留关闭按钮
        const closeBtn = infoPopup.querySelector('span');
        infoPopup.innerHTML = '';
        infoPopup.appendChild(closeBtn);
        infoPopup.innerHTML += html;
        // 保证弹窗不会超出屏幕
        let left = clientX + 10;
        let top = clientY + 10;
        const popupWidth = 340;
        const popupHeight = 220;
        if (left + popupWidth > window.innerWidth) left = window.innerWidth - popupWidth - 10;
        if (top + popupHeight > window.innerHeight) top = window.innerHeight - popupHeight - 10;
        infoPopup.style.left = left + 'px';
        infoPopup.style.top = top + 'px';
        infoPopup.style.display = 'block';
        event.stopPropagation?.();
      }
    }
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
          startColor: 0xe4007f, // 起点颜色
          endColor: 0xffffff, // 终点颜色
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

    // 隐藏dom
    const loading = document.querySelector('#loading')
    loading.classList.add('out')
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