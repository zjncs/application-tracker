const defaultProjects = [
  { id: "hetao", name: "河套学院", status: "applied", region: "内地", priority: "medium", note: "跟进结果和补充材料通知。" },
  { id: "agi", name: "通用人工智能研究院", status: "applied", region: "内地", priority: "high", note: "关注面试/考核安排。" },
  { id: "iscas", name: "中科院软件所", status: "applied", region: "北京", priority: "high", note: "准备科研经历说明和导师沟通。" },
  { id: "cuhksz-mair", name: "港中深 MAIR", status: "applied", region: "深圳/香港", priority: "high", note: "检查推荐信和网申状态。" },
  { id: "westlake", name: "西湖大学", status: "todo", region: "杭州", priority: "high", note: "确认项目方向、导师和截止日期。" },
  { id: "ict-net", name: "中科院网络", status: "todo", region: "北京", priority: "medium", note: "整理网络/系统相关经历。" },
  { id: "cas-cyber", name: "中科院网安", status: "todo", region: "北京", priority: "medium", note: "准备安全方向材料版本。" },
  { id: "ict-cas", name: "中科院计算所", status: "todo", region: "北京", priority: "high", note: "优先确认夏令营/推免批次要求。" },
  { id: "bupt", name: "北邮", status: "todo", region: "北京", priority: "medium", note: "确认 AI/网安/计算机学院入口。" },
  { id: "bnu", name: "北师大", status: "todo", region: "北京", priority: "low", note: "筛选匹配导师与方向。" },
  { id: "buaa", name: "北航", status: "todo", region: "北京", priority: "high", note: "准备成绩排名、科研材料、个人陈述。" },
  { id: "hkust-gz", name: "港科广", status: "todo", region: "广州", priority: "high", note: "确认 MPhil/PhD/硕士提前批路径。" },
  { id: "ntu-early", name: "南洋理工提前批", status: "todo", region: "新加坡", priority: "high", note: "准备英文 CV、PS、推荐信。" },
  { id: "pengcheng", name: "鹏城实验室", status: "todo", region: "深圳", priority: "medium", note: "匹配导师组和实习/科研项目。" },
  { id: "tele", name: "tele", status: "todo", region: "待确认", priority: "low", note: "补全项目全称、官网、截止日期。" },
  { id: "qiyuan", name: "启元实验室", status: "todo", region: "北京", priority: "medium", note: "确认开放项目和申请材料。" },
  { id: "cuhksz-sse", name: "港中深理工学院", status: "todo", region: "深圳/香港", priority: "high", note: "确认是否与 MAIR 材料复用。" },
  { id: "zgcsvr", name: "中关村暑研", status: "todo", region: "北京", priority: "medium", note: "关注报名窗口和导师方向。" },
  { id: "zju-uiuc", name: "浙大 UIUC", status: "todo", region: "杭州/国际", priority: "medium", note: "确认项目类型、语言成绩和申请入口。" },
];

const statusLabels = {
  todo: "待申请",
  "in-progress": "准备中",
  submitted: "已提交",
  applied: "已申请",
};

const priorityLabels = {
  high: "高",
  medium: "中",
  low: "低",
};

const storageKey = "application-tracker-projects-v2";
const legacyStorageKey = "application-tracker-state-v1";
const template = document.querySelector("#projectTemplate");
const appliedList = document.querySelector("#appliedList");
const todoList = document.querySelector("#todoList");
const stats = document.querySelector("#stats");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const priorityFilter = document.querySelector("#priorityFilter");
const addProjectForm = document.querySelector("#addProjectForm");
const newName = document.querySelector("#newName");
const newRegion = document.querySelector("#newRegion");
const newStatus = document.querySelector("#newStatus");
const newPriority = document.querySelector("#newPriority");

let projects = loadProjects();

function loadProjects() {
  const savedProjects = readJson(storageKey);
  if (Array.isArray(savedProjects) && savedProjects.length) {
    return savedProjects.map(normalizeProject);
  }

  const legacy = readJson(legacyStorageKey) || {};
  return defaultProjects.map((project) => normalizeProject({ ...project, ...(legacy[project.id] || {}) }));
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function normalizeProject(project) {
  return {
    id: project.id || createId(),
    name: project.name || "未命名项目",
    status: statusLabels[project.status] ? project.status : "todo",
    region: project.region || "待确认",
    priority: priorityLabels[project.priority] ? project.priority : "medium",
    note: project.note || "",
    createdAt: project.createdAt || Date.now(),
  };
}

function saveProjects() {
  localStorage.setItem(storageKey, JSON.stringify(projects));
}

function updateProject(id, patch) {
  projects = projects.map((project) => (project.id === id ? normalizeProject({ ...project, ...patch }) : project));
  saveProjects();
}

function deleteProject(id) {
  projects = projects.filter((project) => project.id !== id);
  saveProjects();
  render();
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const priority = priorityFilter.value;

  const filtered = projects.filter((project) => {
    const haystack = `${project.name} ${project.region} ${project.note}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesStatus = status === "all" || project.status === status;
    const matchesPriority = priority === "all" || project.priority === priority;
    return matchesQuery && matchesStatus && matchesPriority;
  });

  const applied = filtered.filter(isAppliedColumn);
  const todo = filtered.filter((project) => !isAppliedColumn(project));

  renderStats(projects);
  renderList(appliedList, applied);
  renderList(todoList, todo);
  document.querySelector("#appliedCount").textContent = applied.length;
  document.querySelector("#todoCount").textContent = todo.length;
}

function isAppliedColumn(project) {
  return project.status === "applied" || project.status === "submitted";
}

function renderStats(all) {
  const counts = {
    total: all.length,
    applied: all.filter(isAppliedColumn).length,
    progress: all.filter((item) => item.status === "in-progress").length,
    high: all.filter((item) => item.priority === "high").length,
  };

  stats.innerHTML = [
    ["总项目", counts.total],
    ["已提交/已申请", counts.applied],
    ["准备中", counts.progress],
    ["高优先级", counts.high],
  ]
    .map(([label, value]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`)
    .join("");
}

function renderList(container, items) {
  container.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "没有匹配的项目";
    container.append(empty);
    return;
  }

  items
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.name.localeCompare(b.name, "zh-CN"))
    .forEach((project) => container.append(createProjectCard(project)));
}

function createProjectCard(project) {
  const node = template.content.firstElementChild.cloneNode(true);
  const nameControl = node.querySelector(".name-control");
  const regionControl = node.querySelector(".region-control");
  const badge = node.querySelector(".badge");
  const deleteControl = node.querySelector(".delete-control");
  const statusControl = node.querySelector(".status-control");
  const priorityControl = node.querySelector(".priority-control");
  const note = node.querySelector("textarea");

  nameControl.value = project.name;
  regionControl.value = project.region;
  badge.textContent = statusLabels[project.status];
  badge.className = `badge ${badgeClass(project.status)}`;
  statusControl.value = project.status;
  priorityControl.value = project.priority;
  note.value = project.note;

  nameControl.addEventListener("input", () => updateProject(project.id, { name: nameControl.value.trim() || "未命名项目" }));
  regionControl.addEventListener("input", () => updateProject(project.id, { region: regionControl.value.trim() || "待确认" }));

  statusControl.addEventListener("change", () => {
    updateProject(project.id, { status: statusControl.value });
    render();
  });

  priorityControl.addEventListener("change", () => {
    updateProject(project.id, { priority: priorityControl.value });
    render();
  });

  note.addEventListener("input", () => updateProject(project.id, { note: note.value }));

  deleteControl.addEventListener("click", () => {
    if (confirm(`删除「${project.name}」？`)) {
      deleteProject(project.id);
    }
  });

  return node;
}

function priorityRank(priority) {
  return { high: 0, medium: 1, low: 2 }[priority] ?? 3;
}

function badgeClass(status) {
  return {
    todo: "todo",
    "in-progress": "progress",
    submitted: "submitted",
    applied: "applied",
  }[status];
}

addProjectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = newName.value.trim();
  if (!name) {
    newName.focus();
    return;
  }

  projects.unshift(
    normalizeProject({
      id: createId(),
      name,
      region: newRegion.value.trim() || "待确认",
      status: newStatus.value,
      priority: newPriority.value,
      note: "",
      createdAt: Date.now(),
    }),
  );
  saveProjects();
  addProjectForm.reset();
  newPriority.value = "medium";
  render();
});

[searchInput, statusFilter, priorityFilter].forEach((element) => {
  element.addEventListener("input", render);
  element.addEventListener("change", render);
});

render();
