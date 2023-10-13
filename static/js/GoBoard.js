import { GameObject } from "./GameObject.js";
import { Board } from "./Board.js";

export class GoBoard extends GameObject {
    constructor(ctx, parent, size) {
        super();
        this.ctx = ctx;
        this.parent = parent;
        this.size = size;
        this.L = 0;
        this.cell_len = 0;
        this.is_black = true;
        this.virtual_x = -1;
        this.virtual_y = -1;
        this.last_x = -1;
        this.last_y = -1;
        this.board = new Board(size, [], true, 0);
        this.g = this.board.get_board();
        // 棋子样式 落子声音文件
        this.black_image = new Image();
        this.white_image = new Image();
        this.audio_play = new Audio();
        this.remove1 = new Audio();
        this.remove2 = new Audio();
        this.remove3 = new Audio();
        this.remove4 = new Audio();
        this.audio_play.src = '../static/audio/play.wav';
        this.black_image.src = '../static/image/shell_stb1.png';
        this.white_image.src = '../static/image/shell_stw9.png';
        this.remove1.src = '../static/audio/remove1.wav';
        this.remove2.src = '../static/audio/remove2.wav';
        this.remove3.src = '../static/audio/remove3.wav';
        this.remove4.src = '../static/audio/remove4.wav';
    }

    init_stars() {
        if (this.size == 19) {
            for (let i = 4; i <= 16; i += 6) {
                for (let j = 4; j <= 16; j += 6) {
                    this.draw_stars(i, j);
                }
            }
        } else if (this.size == 13) {
            this.draw_stars(4, 4);
            this.draw_stars(7, 7);
            this.draw_stars(4, 10);
            this.draw_stars(10, 4);
            this.draw_stars(10, 10);
        }
    }


    add_mouse_events() {
        this.ctx.canvas.addEventListener("mousemove", this.handle_mousemove);
        this.ctx.canvas.addEventListener("click", this.handle_mouseclick);
    }

    handle_mousemove = (e) => {
        let click_x = e.offsetX;
        let click_y = e.offsetY;
        if (click_x > this.parent.clientWidth || click_y > this.parent.clientHeight) {
            this.virtual_x = -1;
            this.virtual_y = -1;
            return;
        }
        let move_x = e.offsetX;
        let move_y = e.offsetY;
        let x = Math.round(move_y / this.cell_len);
        let y = Math.round(move_x / this.cell_len);
        this.virtual_x = this.virtual_y = -1;
        if (x <= 0 || x > this.size || y <= 0 || y > this.size || this.g[x][y]) {
            return;
        }
        this.virtual_x = y;
        this.virtual_y = x;
    }

    handle_mouseclick = (e) => {
        let click_x = e.offsetX;
        let click_y = e.offsetY;
        if (click_x > this.parent.clientWidth || click_y > this.parent.clientHeight) {
            return;
        }
        let x = Math.round(click_y / this.cell_len);
        let y = Math.round(click_x / this.cell_len);
        this.virtual_x = this.virtual_y = -1;
        if (x <= 0 || x > this.size || y <= 0 || y > this.size || this.g[x][y]) return;
        if (this.board.play(x, y)) {
            this.is_black = !this.is_black;
            this.last_x = x, this.last_y = y;
            this.audio_play.play();
            // 监听语音对象1的播放完成事件
            this.audio_play.onended = () => {
                let cap_count = this.board.get_cap_stones_count();
                if (cap_count >= 10) {
                    this.remove4.play();
                } else if (cap_count >= 5) {
                    this.remove3.play();
                } else if (cap_count >= 2) {
                    this.remove2.play();
                } else if (cap_count == 1) {
                    this.remove1.play();
                }
            };
        }
    }

    remove_mouse_events() {
        this.ctx.canvas.removeEventListener("mousemove", this.handle_mousemove);
        this.ctx.canvas.removeEventListener("click", this.handle_mouseclick);
    }

    start() {

    }

    draw_virtual_stone(x, y) {
        const center_x = x * this.cell_len;
        const center_y = y * this.cell_len;
        const r = this.cell_len / 2.5;
        if (this.is_black) {
            this.ctx.fillStyle = "black";
        } else if (!this.is_black) {
            this.ctx.fillStyle = 'white';
        }
        this.ctx.fillRect(center_x - this.cell_len / 5, center_y - this.cell_len / 5, r, r);
    }

    draw_lines() {
        this.ctx.lineWidth = 0.5;
        for (let i = 1; i <= this.size; i++) {
            this.ctx.moveTo(this.cell_len, this.cell_len * i);
            this.ctx.lineTo(this.cell_len * this.size, this.cell_len * i);
            this.ctx.stroke();
            this.ctx.moveTo(this.cell_len * i, this.cell_len);
            this.ctx.lineTo(this.cell_len * i, this.cell_len * this.size);
            this.ctx.stroke();
        }
    }

    draw_indexes() {
        for (let i = this.size; i >= 1; i--) {
            this.ctx.fillStyle = "black";
            this.ctx.font = "12px Arial";
            this.ctx.fillText(this.size + 1 - i, this.cell_len * 0.3, this.cell_len * i + 5);
            this.ctx.fillText(this.size + 1 - i, this.cell_len * (this.size + 0.5), this.cell_len * i + 5);
        }
        let alp;
        for (let i = 1; i <= this.size; i++) {
            this.ctx.fillStyle = "black";
            alp = i >= 9 ? String.fromCharCode(65 + i) : String.fromCharCode(64 + i);
            this.ctx.fillText(alp, this.cell_len * i - 2, this.cell_len * (this.size + 0.7));
            this.ctx.fillText(alp, this.cell_len * i - 2, this.cell_len * 0.5);
        }
    }

    draw_stars(x, y) {
        this.ctx.fillStyle = "#000000";
        this.ctx.beginPath();
        this.ctx.arc(x * this.cell_len, y * this.cell_len, this.cell_len / 14, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // 每秒根据浏览器更新大小
    update_size() {
        // 因为区域是不断变化的，所以要在每一帧里动态地求一个区域中可以包含的最大的矩形的一个格子的长和宽
        this.L = parseInt(Math.min(this.parent.clientWidth / this.size, this.parent.clientHeight / this.size));
        this.ctx.canvas.width = this.L * this.size;
        this.ctx.canvas.height = this.L * this.size;
        this.cell_len = parseInt(this.ctx.canvas.width / (this.size + 1));
    }

    draw_stones(x, y, color) {
        const center_x = x * this.cell_len;
        const center_y = y * this.cell_len;
        const r = this.cell_len / 2;
        if (color === 1) {
            this.ctx.beginPath();
            this.ctx.arc(center_x, center_y, r, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.drawImage(this.black_image, center_x - r, center_y - r, r * 2, r * 2);
        } else if (color === 2) {
            this.ctx.beginPath();
            this.ctx.arc(center_x, center_y, r, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.drawImage(this.white_image, center_x - r, center_y - r, r * 2, r * 2);
        }
    }

    draw_red_point(x, y) {
        const center_x = x * this.cell_len;
        const center_y = y * this.cell_len;
        const r = this.cell_len / 8;
        this.ctx.fillStyle = 'red';
        this.ctx.strokeStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc(center_x, center_y, r, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.fillStyle = null;
    }

    on_destory() {
    }

    update() {
        this.add_mouse_events();
        this.update_size();
        this.draw_lines();
        this.init_stars();
        this.draw_indexes();
        this.render();
    }

    render() {
        for (let r = 1; r <= this.size; r++) {
            for (let c = 1; c <= this.size; c++) {
                this.draw_stones(c, r, this.g[r][c]);
                if (this.last_x != -1 && this.last_y != -1) this.draw_red_point(this.last_y, this.last_x);
                if (this.virtual_x != -1 && this.virtual_y != -1) this.draw_virtual_stone(this.virtual_x, this.virtual_y);
            }
        }
    }
}