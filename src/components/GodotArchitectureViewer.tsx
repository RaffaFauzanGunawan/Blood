import React, { useState } from 'react';
import {
  FolderTree,
  FileCode,
  Layers,
  Cpu,
  Copy,
  Check,
  ChevronRight,
  GitBranch,
  Settings,
  Shield,
} from 'lucide-react';

export const GodotArchitectureViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'scripts' | 'statemachine' | 'ysort'>('nodes');
  const [selectedScript, setSelectedScript] = useState<
    | 'Player.gd'
    | 'Enemy.gd'
    | 'ItemData.gd'
    | 'DialogueManager.gd'
    | 'SaveManager.gd'
    | 'TouchController.gd'
    | 'GothicLighting.gd'
    | 'project.godot'
  >('Player.gd');
  const [selectedNode, setSelectedNode] = useState<string>('Player.tscn/CharacterBody2D');
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scriptsContent: Record<string, { code: string; desc: string }> = {
    'Player.gd': {
      desc: 'Skrip utama pergerakan 8-arah/4-arah, integrasi AnimationTree blend space, dan pemanggilan hitbox serang.',
      code: `extends CharacterBody2D
class_name Player

@export var move_speed : float = 100.0
@export var max_hp : int = 100
var current_hp : int = 100

@onready var animation_tree : AnimationTree = $AnimationTree
@onready var state_machine = animation_tree.get("parameters/playback")
@onready var hitbox_pivot : Node2D = $HitboxPivot
@onready var attack_area : Area2D = $HitboxPivot/Area2D

var input_vector : Vector2 = Vector2.ZERO
var is_attacking : bool = false

func _ready():
    current_hp = max_hp
    animation_tree.active = true
    attack_area.monitoring = false

func _physics_process(_delta):
    if is_attacking:
        velocity = Vector2.ZERO
        move_and_slide()
        return

    input_vector.x = Input.get_action_strength("move_right") - Input.get_action_strength("move_left")
    input_vector.y = Input.get_action_strength("move_down") - Input.get_action_strength("move_up")
    input_vector = input_vector.normalized()

    if input_vector != Vector2.ZERO:
        # Set posisi blend vector di AnimationTree (4-Arah)
        animation_tree.set("parameters/Idle/blend_position", input_vector)
        animation_tree.set("parameters/Walk/blend_position", input_vector)
        animation_tree.set("parameters/Attack/blend_position", input_vector)
        
        # Sesuaikan rotasi HitboxPivot mengikuti arah hadap pemain
        hitbox_pivot.rotation = input_vector.angle()
        state_machine.travel("Walk")
        velocity = input_vector * move_speed
    else:
        state_machine.travel("Idle")
        velocity = Vector2.ZERO

    if Input.is_action_just_pressed("attack"):
        start_attack()

    move_and_slide()

func start_attack():
    is_attacking = true
    attack_area.monitoring = true
    state_machine.travel("Attack")

# Dipanggil via AnimationPlayer method track saat animasi serang selesai
func finish_attack():
    is_attacking = false
    attack_area.monitoring = false
    state_machine.travel("Idle")

func take_damage(amount: int):
    current_hp = max(0, current_hp - amount)
    if current_hp <= 0:
        die()

func die():
    print("Player telah gugur!")`,
    },
    'Enemy.gd': {
      desc: 'Finite State Machine (FSM) sederhana: IDLE, CHASE, dan ATTACK menggunakan Area2D DetectionZone.',
      code: `extends CharacterBody2D
class_name Enemy

enum State { IDLE, WANDER, CHASE, ATTACK, HURT, DEAD }

@export var move_speed : float = 45.0
@export var max_hp : int = 30
@export var damage : int = 8
@export var attack_cooldown : float = 1.0

var current_hp : int = 30
var current_state : State = State.IDLE
var target_player : CharacterBody2D = null
var attack_timer : float = 0.0

@onready var detection_zone : Area2D = $DetectionZone
@onready var sprite : Sprite2D = $Sprite2D

func _ready():
    current_hp = max_hp
    detection_zone.body_entered.connect(_on_detection_zone_body_entered)
    detection_zone.body_exited.connect(_on_detection_zone_body_exited)

func _physics_process(delta):
    if attack_timer > 0:
        attack_timer -= delta

    match current_state:
        State.IDLE:
            velocity = Vector2.ZERO
        State.CHASE:
            if target_player:
                var dir = (target_player.global_position - global_position).normalized()
                velocity = dir * move_speed
                # Cek jarak serang
                if global_position.distance_to(target_player.global_position) < 20.0:
                    if attack_timer <= 0:
                        perform_attack()
            else:
                current_state = State.IDLE
        State.DEAD:
            velocity = Vector2.ZERO

    move_and_slide()

func _on_detection_zone_body_entered(body: Node2D):
    if body is Player:
        target_player = body
        current_state = State.CHASE

func _on_detection_zone_body_exited(body: Node2D):
    if body == target_player:
        target_player = null
        current_state = State.IDLE

func perform_attack():
    attack_timer = attack_cooldown
    if target_player and target_player.has_method("take_damage"):
        target_player.take_damage(damage)

func take_damage(amount: int):
    current_hp -= amount
    if current_hp <= 0:
        current_state = State.DEAD
        queue_free()`,
    },
    'ItemData.gd': {
      desc: 'Resource Godot 4 kustom untuk mendefinisikan item RPG (potion, senjata, relik) langsung dari Inspector tanpa database eksternal.',
      code: `class_name ItemData
extends Resource

@export var id : String = ""
@export var name : String = ""
@export_multiline var description : String = ""
@export var icon : Texture2D
@export var is_stackable : bool = false
@export var heal_amount : int = 0
@export var attack_bonus : int = 0
@export var value : int = 10

func use(player: Player) -> bool:
    if heal_amount > 0:
        if player.current_hp >= player.max_hp:
            return false
        player.current_hp = min(player.max_hp, player.current_hp + heal_amount)
        return true
    return false`,
    },
    'DialogueManager.gd': {
      desc: 'Sistem dialog berbasis UI RichTextLabel dan Dictionary alur percakapan NPC.',
      code: `extends CanvasLayer
class_name DialogueManager

signal dialogue_started
signal dialogue_finished

@onready var dialogue_box : Control = $DialogueBox
@onready var speaker_label : Label = $DialogueBox/SpeakerLabel
@onready var text_label : RichTextLabel = $DialogueBox/RichTextLabel

var current_dialogue_queue : Array = []
var is_active : bool = false

var dialogue_data = {
    "npc_elder": [
        "Halo petualang muda! Selamat datang di Ravenfall.",
        "Dunia sedang dalam bahaya karena kutukan Bulan Darah.",
        "Ambil pedang ini dan bawa kembali Piala Darah Abadi!"
    ],
    "npc_merchant": [
        "Butuh ramuan penyembuh untuk perjalananmu?",
        "Kunjungi stanku kapan saja kau butuh pasokan baru!"
    ]
}

func start_dialogue(npc_id: String):
    if not dialogue_data.has(npc_id):
        return
    current_dialogue_queue = dialogue_data[npc_id].duplicate()
    is_active = true
    dialogue_box.visible = true
    emit_signal("dialogue_started")
    show_next_line()

func show_next_line():
    if current_dialogue_queue.is_empty():
        close_dialogue()
        return
    var next_text = current_dialogue_queue.pop_front()
    text_label.text = next_text

func _input(event):
    if is_active and event.is_action_just_pressed("interact"):
        show_next_line()

func close_dialogue():
    is_active = false
    dialogue_box.visible = false
    emit_signal("dialogue_finished")`,
    },
    'SaveManager.gd': {
      desc: 'Sistem penyimpanan status game ke format JSON internal Godot (user://savegame.json).',
      code: `extends Node
class_name SaveManager

const SAVE_PATH = "user://savegame.json"

func save_game(player: Player, inventory_data: Array) -> bool:
    var save_data = {
        "player_pos_x": player.global_position.x,
        "player_pos_y": player.global_position.y,
        "hp": player.current_hp,
        "max_hp": player.max_hp,
        "inventory": inventory_data,
        "timestamp": Time.get_unix_time_from_system()
    }
    
    var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
    if file == null:
        printerr("Gagal membuka file simpanan: ", FileAccess.get_open_error())
        return false
    var json_string = JSON.stringify(save_data, "\\t")
    file.store_string(json_string)
    file.close()
    print("Permainan berhasil disimpan ke: ", SAVE_PATH)
    return true

func load_game() -> Dictionary:
    if not FileAccess.file_exists(SAVE_PATH):
        print("Tidak ditemukan file simpanan di: ", SAVE_PATH)
        return {}
    var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
    var content = file.get_as_text()
    file.close()
    
    var test_json_conv = JSON.new()
    var parse_result = test_json_conv.parse(content)
    if parse_result != OK:
        printerr("Gagal parsing JSON simpanan!")
        return {}
    return test_json_conv.data`,
    },
    'TouchController.gd': {
      desc: 'Skrip kontroler layar sentuh / tombol fisik Godot 4 menggunakan TouchScreenButton & InputEventScreenTouch.',
      code: `extends CanvasLayer
class_name TouchController

# Mengemulasi tombol fisik gamepad arcade ke aksi Input Map Godot
@onready var btn_up : TouchScreenButton = $DPad/Up
@onready var btn_down : TouchScreenButton = $DPad/Down
@onready var btn_left : TouchScreenButton = $DPad/Left
@onready var btn_right : TouchScreenButton = $DPad/Right
@onready var btn_attack : TouchScreenButton = $Actions/ButtonA
@onready var btn_dash : TouchScreenButton = $Actions/ButtonB
@onready var btn_interact : TouchScreenButton = $Actions/ButtonX
@onready var btn_potion : TouchScreenButton = $Actions/ButtonY

func _ready():
    # Hubungkan event pressed & released ke Input Map Godot
    btn_up.pressed.connect(func(): Input.action_press("move_up"))
    btn_up.released.connect(func(): Input.action_release("move_up"))
    btn_down.pressed.connect(func(): Input.action_press("move_down"))
    btn_down.released.connect(func(): Input.action_release("move_down"))
    btn_left.pressed.connect(func(): Input.action_press("move_left"))
    btn_left.released.connect(func(): Input.action_release("move_left"))
    btn_right.pressed.connect(func(): Input.action_press("move_right"))
    btn_right.released.connect(func(): Input.action_release("move_right"))

    btn_attack.pressed.connect(func(): Input.action_press("attack"))
    btn_attack.released.connect(func(): Input.action_release("attack"))
    btn_interact.pressed.connect(func(): Input.action_press("interact"))
    btn_interact.released.connect(func(): Input.action_release("interact"))
    btn_dash.pressed.connect(func(): Input.action_press("dash"))
    btn_dash.released.connect(func(): Input.action_release("dash"))`,
    },
    'GothicLighting.gd': {
      desc: 'Sistem pencahayaan 2D horor gothic menggunakan CanvasModulate dan PointLight2D di Godot 4.',
      code: `extends Node2D
class_name GothicLighting

# CanvasModulate menggelapkan seluruh pemandangan ke suasana malam terkutuk
@onready var canvas_modulate : CanvasModulate = $CanvasModulate
@onready var player_torch : PointLight2D = $Player/TorchLight
@onready var thunder_timer : Timer = $ThunderTimer

# Palet warna atmosfer horor
const BLOOD_MOON_COLOR = Color(0.18, 0.05, 0.08, 1.0)
const MIDNIGHT_COLOR = Color(0.04, 0.06, 0.12, 1.0)

func _ready():
    set_blood_moon(true)
    thunder_timer.timeout.connect(_on_thunder_timeout)
    thunder_timer.start(randf_range(8.0, 16.0))

func set_blood_moon(enabled: bool):
    if enabled:
        canvas_modulate.color = BLOOD_MOON_COLOR
    else:
        canvas_modulate.color = MIDNIGHT_COLOR

func _on_thunder_timeout():
    trigger_lightning_flash()
    thunder_timer.start(randf_range(10.0, 20.0))

func trigger_lightning_flash():
    var tween = create_tween()
    # Kilatan putih menerangi seluruh kanvas
    tween.tween_property(canvas_modulate, "color", Color(1.2, 1.2, 1.4, 1.0), 0.08)
    tween.tween_property(canvas_modulate, "color", BLOOD_MOON_COLOR, 0.4)`,
    },
    'project.godot': {
      desc: 'Konfigurasi Project Settings resmi Godot 4 untuk Retro Pixel Art (320x180) & Nearest Filtering.',
      code: `; Engine configuration file for 2D Retro Pixel RPG
; Project Settings: Window 320x180 & Nearest Texture Filtering

[application]
config/name="Pixel Art Open World RPG"
run/main_scene="res://scenes/World.tscn"
config/features=PackedStringArray("4.3", "Forward Plus")

[display]
window/size/viewport_width=320
window/size/viewport_height=180
window/size/window_width_override=1280
window/size/window_height_override=720
window/stretch/mode="canvas_items"
window/stretch/aspect="keep"

[rendering]
textures/canvas_textures/default_texture_filter=0 ; 0 = Nearest (Crisp Pixel Art)
environment/defaults/default_clear_color=Color(0.12, 0.16, 0.23, 1)

[input]
move_up={ "deadzone": 0.5, "events": [Key(W), Key(Up)] }
move_down={ "deadzone": 0.5, "events": [Key(S), Key(Down)] }
move_left={ "deadzone": 0.5, "events": [Key(A), Key(Left)] }
move_right={ "deadzone": 0.5, "events": [Key(D), Key(Right)] }
attack={ "deadzone": 0.5, "events": [MouseButton(Left), Key(J)] }
interact={ "deadzone": 0.5, "events": [Key(E), Key(F)] }`,
    },
  };

  const nodeTreeData = [
    {
      id: 'Player.tscn',
      name: 'Player.tscn (CharacterBody2D)',
      type: 'scene',
      children: [
        {
          id: 'Player.tscn/CharacterBody2D',
          name: 'CharacterBody2D (Root)',
          badge: 'Node2D',
          desc: 'Badan fisik berkecepatan dinamis (move_and_slide), mengendalikan pergerakan & kalkulasi tabrakan.',
          inspector: [
            { key: 'Motion Mode', val: 'Floating (Top-Down RPG)' },
            { key: 'Collision Layer', val: '1 (Player)' },
            { key: 'Collision Mask', val: '2 (World Solids)' },
            { key: 'Script', val: 'res://scripts/Player.gd' },
          ],
        },
        {
          id: 'Player.tscn/Sprite2D',
          name: 'Sprite2D',
          badge: 'Visual',
          desc: 'Menampilkan tekstur spritesheet piksel karakter dengan Nearest texture filter.',
          inspector: [
            { key: 'Texture', val: 'res://assets/player_spritesheet.png' },
            { key: 'Hframes', val: '4 (Kolom Animasi)' },
            { key: 'Vframes', val: '4 (Arah Hadap)' },
          ],
        },
        {
          id: 'Player.tscn/CollisionShape2D',
          name: 'CollisionShape2D (Kaki)',
          badge: 'Physics',
          desc: 'Bentuk tabrakan (kapsul kecil) di area telapak kaki saja agar bagian kepala/badan bisa menumpuk objek secara natural.',
          inspector: [
            { key: 'Shape', val: 'CapsuleShape2D (Radius: 4px, Height: 8px)' },
            { key: 'Position', val: 'Vector2(0, 4)' },
          ],
        },
        {
          id: 'Player.tscn/AnimationPlayer',
          name: 'AnimationPlayer',
          badge: 'Animation',
          desc: 'Menampung track animasi: IdleDown, IdleUp, WalkDown, WalkUp, AttackDown, dll.',
          inspector: [
            { key: 'Animations', val: 'Idle (4-arah), Walk (4-arah), Attack (4-arah)' },
          ],
        },
        {
          id: 'Player.tscn/AnimationTree',
          name: 'AnimationTree',
          badge: 'State Machine',
          desc: 'Mengatur transisi otomatis antara Idle, Walk, dan Attack berdasarkan parameter blend_position (Vector2).',
          inspector: [
            { key: 'Tree Root', val: 'AnimationNodeStateMachine' },
            { key: 'Parameters', val: 'parameters/playback, parameters/Idle/blend_position' },
          ],
        },
        {
          id: 'Player.tscn/HitboxPivot',
          name: 'HitboxPivot (Node2D)',
          badge: 'Transform',
          desc: 'Pivot pemutar yang merotasi posisi area serangan pedang mengikuti arah input pemain.',
          children: [
            {
              id: 'Player.tscn/Area2D',
              name: 'Area2D (Hitbox)',
              badge: 'Trigger',
              desc: 'Area deteksi benturan pedang terhadap musuh saat aksi serang aktif.',
              inspector: [
                { key: 'Monitoring', val: 'false (aktif hanya saat mengayun)' },
                { key: 'Collision Layer', val: '4 (PlayerAttack)' },
                { key: 'Collision Mask', val: '8 (EnemyHurtbox)' },
              ],
              children: [
                {
                  id: 'Player.tscn/AttackShape',
                  name: 'CollisionShape2D (Pedang)',
                  badge: 'Shape',
                  desc: 'Bentuk radius jangkauan tebasan pedang.',
                  inspector: [{ key: 'Shape', val: 'CircleShape2D (Radius: 16px)' }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'World.tscn',
      name: 'World.tscn (Open World & Y-Sort)',
      type: 'scene',
      children: [
        {
          id: 'World.tscn/Root',
          name: 'World (Node2D)',
          badge: 'Root',
          desc: 'Root dunia dengan y_sort_enabled = true.',
          inspector: [{ key: 'Y Sort Enabled', val: 'true' }],
        },
        {
          id: 'World.tscn/TileMap',
          name: 'TileMap (Layered)',
          badge: 'TileMap',
          desc: 'Pengatur peta ubin dengan beberapa layer berurutan.',
          inspector: [
            { key: 'Layer 0', val: 'Ground (Rumput, Jalan, Air)' },
            { key: 'Layer 1', val: 'Buildings (Rumah, Kuil) [Y-Sort ON]' },
            { key: 'Layer 2', val: 'Decoration (Bunga, Lampu) [Y-Sort ON]' },
            { key: 'Layer 3', val: 'Foreground (Kanopi Atap Pohon)' },
          ],
        },
        {
          id: 'World.tscn/ChunkManager',
          name: 'ChunkManager (Area2D Chunks)',
          badge: 'Optimization',
          desc: 'Membagi peta menjadi segmen 640x360 px. Mengaktifkan/menonaktifkan objek berdasarkan letak pemain.',
          inspector: [{ key: 'Chunk Size', val: 'Vector2(640, 360)' }],
        },
      ],
    },
    {
      id: 'Enemy.tscn',
      name: 'Enemy.tscn (CharacterBody2D)',
      type: 'scene',
      children: [
        {
          id: 'Enemy.tscn/Root',
          name: 'CharacterBody2D (Root)',
          badge: 'Node2D',
          desc: 'Root musuh dengan skrip AI dan navigasi.',
          inspector: [{ key: 'Script', val: 'res://scripts/Enemy.gd' }],
        },
        {
          id: 'Enemy.tscn/DetectionZone',
          name: 'DetectionZone (Area2D)',
          badge: 'Trigger',
          desc: 'Mendeteksi saat Player masuk ke radius kejar (body_entered) dan keluar (body_exited).',
          inspector: [{ key: 'Shape', val: 'CircleShape2D (Radius: 90px)' }],
        },
        {
          id: 'Enemy.tscn/Hurtbox',
          name: 'Hurtbox (Area2D)',
          badge: 'Trigger',
          desc: 'Menerima damage saat tertabrak Hitbox pedang pemain.',
          inspector: [{ key: 'Collision Layer', val: '8 (EnemyHurtbox)' }],
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col w-full bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden text-slate-200">
      {/* Header Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-400" />
          <h2 className="font-bold text-slate-100 text-sm md:text-base font-sans flex items-center gap-2">
            Godot 4 Architecture Studio &amp; GDScript Inspector
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              Godot 4.3+
            </span>
          </h2>
        </div>
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            id="tab-nodes"
            onClick={() => setActiveTab('nodes')}
            className={`px-3 py-1.5 rounded-md font-mono flex items-center gap-1.5 transition ${
              activeTab === 'nodes'
                ? 'bg-slate-800 text-sky-300 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-sky-400" />
            <span>Struktur Node (.tscn)</span>
          </button>
          <button
            id="tab-scripts"
            onClick={() => setActiveTab('scripts')}
            className={`px-3 py-1.5 rounded-md font-mono flex items-center gap-1.5 transition ${
              activeTab === 'scripts'
                ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Kode GDScript</span>
          </button>
          <button
            id="tab-statemachine"
            onClick={() => setActiveTab('statemachine')}
            className={`px-3 py-1.5 rounded-md font-mono flex items-center gap-1.5 transition ${
              activeTab === 'statemachine'
                ? 'bg-slate-800 text-purple-300 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-purple-400" />
            <span>AnimationTree FSM</span>
          </button>
          <button
            id="tab-ysort"
            onClick={() => setActiveTab('ysort')}
            className={`px-3 py-1.5 rounded-md font-mono flex items-center gap-1.5 transition ${
              activeTab === 'ysort'
                ? 'bg-slate-800 text-emerald-300 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Y-Sort &amp; Chunks</span>
          </button>
        </div>
      </div>

      {/* TAB 1: NODE TREE HIERARCHY */}
      {activeTab === 'nodes' && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[380px]">
          {/* Node Tree Hierarchy Column */}
          <div className="lg:col-span-1 bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
            <div className="text-xs font-mono uppercase text-slate-400 font-semibold flex items-center gap-2 pb-2 border-b border-slate-800">
              <FolderTree className="w-4 h-4 text-sky-400" />
              <span>Hierarki Node Scene Tree</span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
              {nodeTreeData.map((scene) => (
                <div key={scene.id} className="space-y-1">
                  <div className="text-[11px] font-mono text-sky-400 font-bold uppercase tracking-wider bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                    {scene.name}
                  </div>
                  <div className="pl-2 space-y-1">
                    {scene.children?.map((node) => (
                      <div key={node.id} className="space-y-1">
                        <button
                          id={`node-btn-${node.id.replace(/[^a-zA-Z0-9]/g, '-')}`}
                          onClick={() => setSelectedNode(node.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition ${
                            selectedNode === node.id
                              ? 'bg-sky-900/50 text-sky-200 border border-sky-700 font-semibold'
                              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-transparent'
                          }`}
                        >
                          <span className="truncate">{node.name}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            {node.badge}
                          </span>
                        </button>
                        {/* Child subnodes */}
                        {node.children && (
                          <div className="pl-4 border-l border-slate-800 space-y-1 mt-1">
                            {node.children.map((child) => (
                              <button
                                key={child.id}
                                onClick={() => setSelectedNode(child.id)}
                                className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition ${
                                  selectedNode === child.id
                                    ? 'bg-sky-900/50 text-sky-200 border border-sky-700 font-semibold'
                                    : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-transparent'
                                }`}
                              >
                                <span className="truncate">{child.name}</span>
                                <span className="text-[9px] font-mono px-1 rounded bg-slate-950 text-slate-500">
                                  {child.badge}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Node Inspector & Godot Properties Column */}
          <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono uppercase text-amber-200 font-semibold">
                    Godot 4 Inspector: {selectedNode}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Res: 320x180 px
                </span>
              </div>
              {/* Node Detailed Information */}
              <div className="mt-3 space-y-3">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs leading-relaxed text-slate-300">
                  <span className="text-sky-400 font-bold font-mono block mb-1">Fungsi Arsitektural:</span>
                  {selectedNode.includes('CharacterBody2D') &&
                    'Root node pemain turunan CharacterBody2D. Berfungsi menghitung kalkulasi fisika dengan metode move_and_slide(), mengendalikan kecepatan pergerakan, dan menjadi titik pusat Y-sorting di posisi alas kaki.'}
                  {selectedNode.includes('Sprite2D') &&
                    'Node visual perender tekstur piksel. Memanfaatkan Texture Filter Nearest agar piksel tajam tanpa blur pada resolusi 320x180. Diatur menggunakan offset Vector2(0, -6) agar poros Y berada tepat di telapak kaki.'}
                  {selectedNode.includes('CollisionShape2D') &&
                    'Bentuk tabrakan fisik dengan dunia (dinding/pohon). Diletakkan hanya di bagian kaki agar karakter bisa berjalan mendekati pangkal pohon tanpa tersangkut di dahan bagian atas.'}
                  {selectedNode.includes('AnimationPlayer') &&
                    'Mesin antrean animasi keyframe. Menyimpan track animasi 4-arah untuk Idle, Walk, dan Attack.'}
                  {selectedNode.includes('AnimationTree') &&
                    'State Machine yang mengatur transisi dinamis antara Walk dan Idle, serta menginterpolasi arah hadap menggunakan parameter blend_position.'}
                  {selectedNode.includes('HitboxPivot') &&
                    'Node2D yang berputar mengikuti sudut input_vector.angle(). Memastikan tebasan pedang selalu keluar searah dengan hadap pemain.'}
                  {selectedNode.includes('TileMap') &&
                    'Node pengatur peta ubin dengan layer terpisah: Ground, Buildings, Decoration, Foreground. Layer pohon dan bangunan memiliki y_sort_enabled = true.'}
                  {selectedNode.includes('ChunkManager') &&
                    'Area2D pembagi peta 640x360. Mengirimkan sinyal body_entered ke pemain untuk mengaktifkan visibilitas area aktif dan menyembunyikan area yang jauh.'}
                  {selectedNode.includes('DetectionZone') &&
                    'Area2D pendeteksi pada musuh. Jika Player memasuki area ini, musuh berganti status dari IDLE ke CHASE.'}
                </div>
                {/* Simulated Godot Inspector Table */}
                <div className="bg-slate-950/80 rounded-lg border border-slate-800 overflow-hidden text-xs">
                  <div className="bg-slate-900 px-3 py-1.5 font-mono text-[11px] text-slate-400 font-semibold border-b border-slate-800">
                    Properti Konfigurasi Inspector
                  </div>
                  <table className="w-full text-left font-mono">
                    <tbody>
                      <tr className="border-b border-slate-800/60">
                        <td className="px-3 py-2 text-slate-400 w-1/3">Motion Mode</td>
                        <td className="px-3 py-2 text-emerald-400">Floating (Top-Down RPG)</td>
                      </tr>
                      <tr className="border-b border-slate-800/60">
                        <td className="px-3 py-2 text-slate-400">Y Sort Origin</td>
                        <td className="px-3 py-2 text-amber-300">0 px (Bottom Feet Center)</td>
                      </tr>
                      <tr className="border-b border-slate-800/60">
                        <td className="px-3 py-2 text-slate-400">Texture Filter</td>
                        <td className="px-3 py-2 text-sky-300">Nearest (0)</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-slate-400">Collision Layers</td>
                        <td className="px-3 py-2 text-purple-300">Layer 1 (Player), Mask 2 (World)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Arsitektur teruji sesuai standar best-practice Godot 4.
              </span>
              <span className="font-mono text-amber-400">Node2D &gt; CharacterBody2D</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GDSCRIPT CODE VIEWER */}
      {activeTab === 'scripts' && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* File Picker */}
          <div className="lg:col-span-1 bg-slate-900/70 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1 text-xs font-mono">
            <div className="text-[11px] uppercase text-slate-400 font-semibold px-2 py-1 mb-1">
              Berkas Skrip (.gd)
            </div>
            {Object.keys(scriptsContent).map((filename) => (
              <button
                key={filename}
                id={`script-select-${filename.replace(/[^a-zA-Z0-9]/g, '-')}`}
                onClick={() => setSelectedScript(filename as any)}
                className={`w-full text-left px-3 py-2 rounded-md transition flex items-center justify-between ${
                  selectedScript === filename
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/60 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <span>{filename}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>
          {/* Code Viewer Panel */}
          <div className="lg:col-span-3 bg-slate-900/70 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-mono text-sm font-bold text-amber-300 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  {selectedScript}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{scriptsContent[selectedScript].desc}</p>
              </div>
              <button
                id="copy-gdscript-btn"
                onClick={() => copyCode(scriptsContent[selectedScript].code)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-amber-300 border border-slate-700 flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
              </button>
            </div>
            {/* Code Block */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed text-slate-300 select-text">
              <pre>
                <code>{scriptsContent[selectedScript].code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANIMATIONTREE STATE MACHINE */}
      {activeTab === 'statemachine' && (
        <div className="p-4 space-y-4 text-xs">
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
            <h3 className="font-bold text-purple-300 font-sans text-sm flex items-center gap-2 mb-2">
              <GitBranch className="w-4 h-4 text-purple-400" />
              Diagram State Machine &amp; BlendSpace2D (Godot 4 AnimationTree)
            </h3>
            <p className="text-slate-300 leading-relaxed max-w-3xl mb-4">
              Dalam Godot 4, <code>AnimationTree</code> dengan root <code>AnimationNodeStateMachine</code> mengendalikan
              animasi transisi karakter secara mulus. Setiap state (Idle, Walk, Attack) menggunakan{' '}
              <code>AnimationNodeBlendSpace2D</code> yang dipetakan ke 4 titik vektor hadap.
            </p>
            {/* Visual Flow Representation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800 text-center font-mono">
              {/* State 1 */}
              <div className="bg-slate-900 border border-purple-800/60 p-4 rounded-lg flex flex-col items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">State 1</span>
                <h4 className="text-base font-bold text-purple-200 my-2">&quot;Idle&quot;</h4>
                <p className="text-[11px] text-slate-400">
                  Aktif saat <code>input_vector == Vector2.ZERO</code>. Menampilkan animasi diam 4-arah.
                </p>
                <div className="mt-3 text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-400 border border-slate-800 w-full">
                  parameters/Idle/blend_position
                </div>
              </div>
              {/* State 2 */}
              <div className="bg-slate-900 border border-sky-800/60 p-4 rounded-lg flex flex-col items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-sky-400 font-bold">State 2</span>
                <h4 className="text-base font-bold text-sky-200 my-2">&quot;Walk&quot;</h4>
                <p className="text-[11px] text-slate-400">
                  Aktif saat <code>input_vector != Vector2.ZERO</code>. Kecepatan <code>velocity = input * speed</code>.
                </p>
                <div className="mt-3 text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-400 border border-slate-800 w-full">
                  parameters/Walk/blend_position
                </div>
              </div>
              {/* State 3 */}
              <div className="bg-slate-900 border border-red-800/60 p-4 rounded-lg flex flex-col items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-red-400 font-bold">State 3</span>
                <h4 className="text-base font-bold text-red-200 my-2">&quot;Attack&quot;</h4>
                <p className="text-[11px] text-slate-400">
                  Dipicu tombol input <code>attack</code>. Mengaktifkan Hitbox Area2D dan menghentikan pergerakan sejenak.
                </p>
                <div className="mt-3 text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-400 border border-slate-800 w-full">
                  parameters/Attack/blend_position
                </div>
              </div>
            </div>
            {/* Blend Position Coordinates Chart */}
            <div className="mt-4 bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs">
              <div className="text-purple-300 font-bold mb-2">Koordinat 4-Arah BlendSpace2D:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-amber-400 font-bold">Bawah (Down)</div>
                  <div className="text-slate-400 text-[11px]">Vector2(0, 1)</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-amber-400 font-bold">Atas (Up)</div>
                  <div className="text-slate-400 text-[11px]">Vector2(0, -1)</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-amber-400 font-bold">Kiri (Left)</div>
                  <div className="text-slate-400 text-[11px]">Vector2(-1, 0)</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-amber-400 font-bold">Kanan (Right)</div>
                  <div className="text-slate-400 text-[11px]">Vector2(1, 0)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Y-SORT & CHUNK LOADING GUIDE */}
      {activeTab === 'ysort' && (
        <div className="p-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Y-Sort Mechanics */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 flex flex-col gap-2.5">
              <h3 className="font-bold text-emerald-300 font-sans text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Mekanik Y-Sort Depth Sorting
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Dalam game RPG 2D top-down, kedalaman visual ditentukan oleh posisi sumbu Y entitas.
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-[11px] text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span>
                    <strong>Pemain di Atas Pohon (Y Pemain &lt; Y Pohon):</strong> Pemain digambar terlebih dahulu di
                    layar, sehingga dahan pohon menutupi badan pemain secara natural.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span>
                    <strong>Pemain di Bawah Pohon (Y Pemain &gt; Y Pohon):</strong> Pemain digambar setelah pohon,
                    sehingga karakter tampak berdiri di depan batang pohon.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span>
                    <strong>Kunci Poros (Y-Origin):</strong> Pastikan titik origin/pivot <code>Sprite2D</code> diletakkan
                    pada bagian <em>telapak kaki</em>, bukan di tengah badan atau kepala.
                  </span>
                </div>
              </div>
            </div>
            {/* Chunk Loading Optimization */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 flex flex-col gap-2.5">
              <h3 className="font-bold text-purple-300 font-sans text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                Optimasi Chunk Loading (Peta Luas)
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Memuat seluruh dunia open world sekaligus membebani memori dan proses render. Godot 4 menggunakan
                pembagian Area2D:
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-[11px] text-slate-300 font-mono">
                <p className="text-slate-400">// Hubungkan sinyal Area2D ke ChunkManager:</p>
                <div className="bg-slate-900 p-2 rounded text-slate-200 border border-slate-800 text-[10px]">
                  <code>
                    func _on_chunk_area_body_entered(body):<br />
                    &nbsp;&nbsp;if body is Player:<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;chunk_node.visible = true<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;chunk_node.process_mode = PROCESS_MODE_INHERIT
                  </code>
                </div>
                <p className="text-slate-400 text-[10px]">
                  Chunk yang jauh dapat dinonaktifkan (<code>visible = false</code> dan{' '}
                  <code>process_mode = PROCESS_MODE_DISABLED</code>) untuk menghemat FPS.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
