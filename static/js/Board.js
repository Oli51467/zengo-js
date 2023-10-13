"use strict";

const BLACK = 1;
const WHITE = 2;
const EMPTY = 0;
let dx = [-1, 0, 1, 0], dy = [0, 1, 0, -1];

export class Board {
    constructor(size, initial_stones, is_black, handicap) {
        this.size = size;
        this.board = [];
        this.st = [];
        this.last_x = -1;
        this.last_y = -1;
        this.cap_stones_count = 0;
        this.blackForbidden = new Point(-1, -1);
        this.whiteForbidden = new Point(-1, -1);
        this.play_count = 0;
        for (let x = 1; x <= this.size; x++) {
            this.board[x] = [];
            this.st[x] = [];
            for (let y = 1; y <= this.size; y++) {
                this.board[x][y] = EMPTY;
                this.st[x][y] = false;
            }
        }
        for (let i = 0; i < initial_stones.length; i++) {
            this.board[initial_stones[i].x][initial_stones[i].y] = initial_stones[i].side;
        }
        if (is_black && handicap == 0) this.player = BLACK;
        else this.player = WHITE;
        if (this.size === 19 && handicap >= 2 && handicap <= 9) {
            for (let i = 4; i <= 16; i += 12) {
                for (let j = 4; j <= 16; j += 12) {
                    this.board[i][j] = BLACK;
                }
            }
            if (handicap >= 5) {
                this.board[10][10] = BLACK;
            }
            if (handicap >= 6) {
                for (let i = 4; i <= 16; i += 12) {
                    this.board[i][10] = BLACK;
                    this.board[10][i] = BLACK;
                }
            }
            if (handicap === 9) {
                this.board[10][10] = BLACK;
            }
        }
        if (this.size === 13 && handicap >= 2 && handicap <= 5) {
            const positions = [
                [4, 10], [10, 4],
                [4, 10], [10, 4], [10, 10],
                [4, 4], [4, 10], [10, 4], [10, 10],
                [4, 4], [4, 10], [10, 4], [10, 10], [7, 7]
            ];

            for (let i = 0; i < handicap; i++) {
                const [x, y] = positions[i];
                this.board[x][y] = BLACK;
            }
        }
    }

    get_cap_stones_count() {
        return this.cap_stones_count;
    }

    get_board() {
        return this.board;
    }

    changePlayer() {
        if (this.player == BLACK) this.player = WHITE;
        else this.player = BLACK;
    }

    isInBoard(x, y) {
        return x > 0 && x <= this.size && y > 0 && y <= this.size;
    }

    reset() {
        for (let i = 1; i <= this.size; i++) {
            for (let j = 1; j <= this.size; j++) {
                this.st[i][j] = false;
            }
        }
    }

    getAllGroupsLengthAndLiberty(self_count) {
        let count = 0, count_eat = 0, ko_x = -1, ko_y = -1;
        this.cap_stones_count = 0;
        for (let x = 1; x <= this.size; x++) {
            for (let y = 1; y <= this.size; y++) {
                if (this.st[x][y] || this.board[x][y] == EMPTY) continue;
                this.st[x][y] = true;
                let group = new Group(x, y, this.size);
                group.getGroupLengthAndLiberty(x, y, this.board[x][y], this.board);
                for (let stone of group.stones) {
                    this.st[stone.get_x()][stone.get_y()] = true;
                }
                if (group.get_liberties() == 0) {
                    count_eat++;
                    for (let stone of group.stones) {
                        this.cap_stones_count ++;
                        this.board[stone.get_x()][stone.get_y()] = EMPTY;
                        if (group.get_length() == 1) {
                            count++;
                            ko_x = stone.get_x();
                            ko_y = stone.get_y();
                        }
                    }
                }
            }
        }
        if (count == 1 && self_count == 1) {
            if (this.player == BLACK) {
                this.whiteForbidden.set_x(ko_x);
                this.whiteForbidden.set_y(ko_y);
            } else if (this.player == WHITE) {
                this.blackForbidden.set_x(ko_x);
                this.blackForbidden.set_y(ko_y);
            }
        }
        return count_eat;
    }

    play(x, y) {
        if (!this.isInBoard(x, y) || this.board[x][y] != EMPTY) {
            return false;
        }
        if (this.player == BLACK) {
            if (this.blackForbidden.get_x() == x && this.blackForbidden.get_y() == y) {
                return false;
            }
        } else if (this.player == WHITE) {
            if (this.whiteForbidden.get_x() == x && this.whiteForbidden.get_y() == y) {
                return false;
            }
        }
        this.board[x][y] = this.player;
        this.reset();
        let cur_group = new Group(x, y, this.size);
        cur_group.getGroupLengthAndLiberty(x, y, this.player, this.board);
        let self_count = 0;
        for (let stone of cur_group.stones) {
            this.st[stone.get_x()][stone.get_y()] = true;
            self_count++;
        }
        let eat_oppo_groups = this.getAllGroupsLengthAndLiberty(self_count);
        if (cur_group.get_liberties() == 0 && eat_oppo_groups == 0) {
            this.board[x][y] = EMPTY;
            return false;
        } else {
            if (this.player == WHITE) {
                this.whiteForbidden.set_x(-1);
                this.whiteForbidden.set_y(-1);
            } else {
                this.blackForbidden.set_x(-1);
                this.blackForbidden.set_y(-1);
            }
            this.play_count++;
            this.changePlayer();
            this.last_x = x;
            this.last_y = y;
            return true;
        }
    }

    regret(player) {
        if (this.play_count == 0) return false;
        if (this.play_count == 1 && player == WHITE) return false;
    }
}

export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    get_x() {
        return this.x;
    }

    get_y() {
        return this.y;
    }

    set_x(x) {
        this.x = x;
    }

    set_y(y) {
        this.y = y;
    }
}

export class Group {
    constructor(x, y, size) {
        this.liberties = 0;
        this.length = 1;
        this.stones = new Set();
        this.st = [];
        this.size = size
        for (let x = 1; x <= this.size; x++) {
            this.st[x] = [];
            for (let y = 1; y <= this.size; y++) {
                this.st[x][y] = false;
            }
        }
        this.add2Group(x, y);
    }

    reset() {
        for (let x = 1; x <= this.size; x++) {
            for (let y = 1; y <= this.size; y++) {
                this.st[x][y] = false;
            }
        }
    }

    isInBoard(x, y) {
        return x > 0 && x <= this.size && y > 0 && y <= this.size;
    }

    add2Group(x, y) {
        let point = new Point(x, y);
        this.stones.add(point);
    }

    getGroupLengthAndLiberty(x, y, color, board) {
        this.reset();
        this.getGroupLength(x, y, color, board);
    }

    getGroupLength(x, y, color, board) {
        for (let i = 0; i < 4; i++) {
            let nx = parseInt(x) + dx[i];
            let ny = parseInt(y) + dy[i];
            if (!this.isInBoard(nx, ny) || this.st[nx][ny]) continue;
            if (board[nx][ny] === EMPTY) {
                this.liberties++;
                this.st[nx][ny] = true;
                continue;
            }
            if (board[nx][ny] != color) {
                this.st[nx][ny] = true;
                continue;
            }
            this.st[nx][ny] = true;
            this.length++;
            this.add2Group(nx, ny);
            this.getGroupLength(nx, ny, color, board);
        }
    }

    get_liberties() {
        return this.liberties;
    }

    get_length() {
        return this.length;
    }
}