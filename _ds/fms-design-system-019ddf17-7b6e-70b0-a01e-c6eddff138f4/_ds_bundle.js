/* @ds-bundle: {"format":4,"namespace":"FMSDesignSystem_019ddf","components":[],"sourceHashes":{"ui_kits/webapp/AlertCenter.jsx":"eb0e870a8af1","ui_kits/webapp/Card.jsx":"b27b27056598","ui_kits/webapp/DashboardTiles.jsx":"e13fdf7be72e","ui_kits/webapp/Modal.jsx":"4e6c4d5a9c62","ui_kits/webapp/QuickLinks.jsx":"b0db56d4baf5","ui_kits/webapp/Shell.jsx":"7fd2e1d7d456","ui_kits/webapp/UpcomingEvents.jsx":"957afddc3cae","ui_kits/webapp/data.js":"a739c677212a"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.FMSDesignSystem_019ddf = window.FMSDesignSystem_019ddf || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/webapp/AlertCenter.jsx
try { (() => {
/* global React, FMSCard */
const {
  useState
} = React;
const AlertCenter = ({
  alerts,
  onMarkRead
}) => {
  const [tab, setTab] = useState("Unread");
  const filtered = tab === "Unread" ? alerts.filter(a => a.unread) : alerts;
  const unreadCount = alerts.filter(a => a.unread).length;
  return /*#__PURE__*/React.createElement(FMSCard, {
    title: "Alert Center",
    surface: "marshmallow",
    headerRight: /*#__PURE__*/React.createElement("span", {
      style: {
        font: "700 12px Quicksand",
        color: "var(--blueberry-pie--500)"
      }
    }, unreadCount, " Unread")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: "var(--space-sm)"
    }
  }, ["Unread", "All"].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTab(t),
    style: {
      padding: "6px 16px",
      borderRadius: 30,
      font: "700 11px Quicksand",
      cursor: "pointer",
      border: "none",
      background: tab === t ? "var(--blueberry-pie--500)" : "#fff",
      color: tab === t ? "#fff" : "var(--blueberry-pie--500)"
    }
  }, t))), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#fff",
      borderRadius: 5,
      padding: "var(--space-md)",
      textAlign: "center",
      font: "500 13px Quicksand",
      color: "var(--gray-5)"
    }
  }, "No ", tab === "Unread" ? "new" : "", " alerts") : /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, filtered.map(a => /*#__PURE__*/React.createElement("li", {
    key: a.id,
    style: {
      background: "#fff",
      borderRadius: 5,
      padding: "10px 12px",
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      font: "600 12px/1.4 Quicksand",
      color: "var(--blueberry-pie--500)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: a.unread ? "var(--cotton-candy--500)" : "var(--gray-3)",
      marginTop: 5,
      flex: "0 0 auto"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, a.title), " ", a.body), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "500 10px Quicksand",
      color: "var(--gray-5)",
      marginTop: 2
    }
  }, a.time)), a.unread && /*#__PURE__*/React.createElement("button", {
    onClick: () => onMarkRead?.(a.id),
    style: {
      background: "transparent",
      border: "none",
      color: "var(--cotton-candy--500)",
      font: "700 10px Quicksand",
      textTransform: "uppercase",
      cursor: "pointer",
      letterSpacing: ".04em"
    }
  }, "Mark Read")))));
};
window.FMSAlertCenter = AlertCenter;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/AlertCenter.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/Card.jsx
try { (() => {
/* global React */
const {
  useState
} = React;

// Inline sparkle icon (Shine3 approximation — see CAVEATS in design system README)
const Shine = ({
  size = 12,
  color = "white"
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: color,
  "aria-hidden": "true",
  style: {
    flex: "0 0 auto"
  }
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 1.5 L13.6 9 L21 12 L13.6 15 L12 22.5 L10.4 15 L3 12 L10.4 9 Z"
}));
const Card = ({
  title,
  headerRight,
  children,
  surface = "white",
  style,
  className = ""
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const bg = surface === "marshmallow" ? "var(--toasted-marshmallow--500)" : "#fff";
  return /*#__PURE__*/React.createElement("section", {
    className: `fms-card ${className}`,
    style: {
      background: bg,
      borderRadius: 5,
      boxShadow: "var(--shadow-sm)",
      padding: "var(--space-md)",
      ...style
    }
  }, title && /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "var(--space-sm)"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      font: "700 16px/1.2 Quicksand",
      color: "var(--blueberry-pie--500)"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, headerRight)), !collapsed && children);
};
const CardStatLink = ({
  value,
  label,
  color = "cotton",
  onClick
}) => {
  const colorVars = {
    cotton: {
      ring: "var(--cotton-candy--500)",
      value: "var(--cotton-candy--500)",
      label: "var(--blueberry-pie--500)"
    },
    mint: {
      ring: "var(--gummy-sharks--700)",
      value: "var(--gummy-sharks--800)",
      label: "var(--blueberry-pie--500)"
    },
    marsh: {
      ring: "var(--toasted-marshmallow--900)",
      value: "var(--toasted-marshmallow--900)",
      label: "var(--blueberry-pie--500)"
    },
    danger: {
      ring: "var(--danger-500)",
      value: "var(--danger-500)",
      label: "var(--blueberry-pie--500)"
    },
    blueberry: {
      ring: "var(--blueberry-pie--500)",
      value: "var(--blueberry-pie--500)",
      label: "var(--blueberry-pie--500)"
    }
  }[color] || {
    ring: "var(--cotton-candy--500)",
    value: "var(--cotton-candy--500)",
    label: "var(--blueberry-pie--500)"
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      flex: 1,
      minWidth: 0,
      background: "transparent",
      border: `2px solid ${colorVars.ring}`,
      borderRadius: 5,
      padding: "10px 8px",
      cursor: "pointer",
      textAlign: "center",
      font: "Quicksand",
      transition: "opacity .2s ease"
    },
    onMouseOver: e => e.currentTarget.style.opacity = ".8",
    onMouseOut: e => e.currentTarget.style.opacity = "1"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "700 28px/1 Quicksand",
      color: colorVars.value
    }
  }, value === undefined || value === null ? "—" : value), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "700 10px/1.2 Quicksand",
      textTransform: "uppercase",
      letterSpacing: ".06em",
      marginTop: 4,
      color: colorVars.label
    }
  }, label));
};
Object.assign(window, {
  FMSCard: Card,
  FMSCardStatLink: CardStatLink,
  FMSShine: Shine
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/Card.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/DashboardTiles.jsx
try { (() => {
/* global React, FMSCard, FMSCardStatLink */
const DashboardTiles = ({
  data,
  isLoading
}) => {
  return /*#__PURE__*/React.createElement(FMSCard, {
    title: "Dashboard",
    headerRight: /*#__PURE__*/React.createElement("span", {
      style: {
        font: "500 11px Quicksand",
        color: "var(--gray-5)"
      }
    }, isLoading ? "Loading…" : "Updated just now")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "var(--space-md)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: "0 0 var(--space-xs)",
      font: "700 13px Quicksand",
      color: "var(--blueberry-pie--500)"
    }
  }, "Leads Activity"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "500 10px Quicksand",
      color: "var(--gray-5)",
      marginBottom: "var(--space-sm)"
    }
  }, "(Last 7 Calendar Days)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(FMSCardStatLink, {
    value: data.leads.newLeads,
    label: "New Leads",
    color: "cotton"
  }), /*#__PURE__*/React.createElement(FMSCardStatLink, {
    value: data.leads.toured,
    label: "Toured",
    color: "mint"
  }), /*#__PURE__*/React.createElement(FMSCardStatLink, {
    value: data.leads.registered,
    label: "Registered",
    color: "marsh"
  }), /*#__PURE__*/React.createElement(FMSCardStatLink, {
    value: data.leads.noShow,
    label: "No Shows",
    color: "danger"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: "0 0 var(--space-xs)",
      font: "700 13px Quicksand",
      color: "var(--blueberry-pie--500)"
    }
  }, "Tours"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "500 10px Quicksand",
      color: "var(--gray-5)",
      marginBottom: "var(--space-sm)"
    }
  }, "(Upcoming)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(FMSCardStatLink, {
    value: data.tours.today,
    label: "Today",
    color: "cotton"
  }), /*#__PURE__*/React.createElement(FMSCardStatLink, {
    value: data.tours.nextFiveDays,
    label: "Next 5 Days",
    color: "mint"
  }), /*#__PURE__*/React.createElement(FMSCardStatLink, {
    value: data.tours.pastDue,
    label: "Past Due (needs update)",
    color: "danger"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: "0 0 var(--space-xs)",
      font: "700 13px Quicksand",
      color: "var(--blueberry-pie--500)"
    }
  }, "Tasks"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "500 10px Quicksand",
      color: "var(--gray-5)",
      marginBottom: "var(--space-sm)"
    }
  }, "(Open)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(FMSCardStatLink, {
    value: data.tasks.today,
    label: "Due Today",
    color: "cotton"
  }), /*#__PURE__*/React.createElement(FMSCardStatLink, {
    value: data.tasks.thisWeek,
    label: "This Week",
    color: "mint"
  }), /*#__PURE__*/React.createElement(FMSCardStatLink, {
    value: data.tasks.pastDue,
    label: "Past Due",
    color: "danger"
  })))));
};
window.FMSDashboardTiles = DashboardTiles;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/DashboardTiles.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/Modal.jsx
try { (() => {
/* global React */
const Modal = ({
  open,
  title,
  children,
  primaryLabel = "OK",
  onPrimary,
  secondaryLabel = "Cancel",
  onClose
}) => {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "#fff",
      borderRadius: 5,
      boxShadow: "var(--shadow-lg)",
      maxWidth: 520,
      width: "90%",
      overflow: "hidden",
      fontFamily: "Quicksand, sans-serif"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      background: "var(--blueberry-pie--500)",
      color: "#fff",
      padding: "14px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      font: "700 16px Quicksand"
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      width: 26,
      height: 26,
      borderRadius: "50%",
      border: "1px solid #fff",
      background: "transparent",
      color: "#fff",
      cursor: "pointer",
      font: "400 14px sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-lg)",
      font: "600 14px/1.5 Quicksand",
      color: "var(--blueberry-pie--500)"
    }
  }, children), /*#__PURE__*/React.createElement("footer", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      padding: "0 var(--space-lg) var(--space-md)"
    }
  }, secondaryLabel && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: "#fff",
      color: "var(--blueberry-pie--500)",
      border: "2px solid var(--blueberry-pie--500)",
      borderRadius: 35,
      padding: "8px 22px",
      font: "700 13px Quicksand",
      cursor: "pointer"
    }
  }, secondaryLabel), /*#__PURE__*/React.createElement("button", {
    onClick: onPrimary || onClose,
    style: {
      background: "var(--cotton-candy--500)",
      color: "#fff",
      border: "none",
      borderRadius: 35,
      padding: "10px 24px",
      font: "700 13px Quicksand",
      cursor: "pointer"
    }
  }, primaryLabel))));
};
window.FMSModal = Modal;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/Modal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/QuickLinks.jsx
try { (() => {
/* global React, FMSShine */
const QuickLinks = ({
  links,
  onClick
}) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
  style: {
    margin: "0 0 var(--space-sm)",
    font: "700 11px Quicksand",
    color: "var(--blueberry-pie--500)",
    letterSpacing: ".08em",
    textTransform: "uppercase"
  }
}, "Quick Links"), /*#__PURE__*/React.createElement("div", {
  style: {
    display: "flex",
    flexWrap: "wrap",
    gap: "var(--space-sm)"
  }
}, links.map((l, i) => /*#__PURE__*/React.createElement("button", {
  key: i,
  onClick: () => onClick?.(l),
  style: {
    background: "var(--blueberry-pie--500)",
    color: "#fff",
    border: "none",
    borderRadius: 35,
    padding: "10px 22px",
    font: "700 12px Quicksand",
    letterSpacing: ".04em",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    transition: "opacity .2s ease"
  },
  onMouseOver: e => e.currentTarget.style.opacity = ".8",
  onMouseOut: e => e.currentTarget.style.opacity = "1"
}, /*#__PURE__*/React.createElement(FMSShine, {
  size: 11,
  color: "white"
}), /*#__PURE__*/React.createElement("span", null, l.label)))));
window.FMSQuickLinks = QuickLinks;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/QuickLinks.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/Shell.jsx
try { (() => {
/* global React, FMSShine */
const Shell = ({
  user,
  activePath = "/home",
  onSchoolChange,
  onSearch,
  children
}) => {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [schoolMenuOpen, setSchoolMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const navItems = [{
    id: "/home",
    label: "Home",
    icon: "../../assets/icons/home.svg"
  }, {
    id: "/leads",
    label: "Leads",
    icon: "../../assets/icons/leads.svg"
  }, {
    id: "/families",
    label: "Families",
    icon: "../../assets/icons/families.svg"
  }, {
    id: "/class-lists",
    label: "Class Lists",
    icon: "../../assets/icons/class-lists.svg"
  }, {
    id: "/employees",
    label: "Employees",
    icon: "../../assets/icons/employees.svg"
  }, {
    id: "/events",
    label: "Events",
    icon: "../../assets/icons/events.svg"
  }, {
    id: "/reporting",
    label: "Reporting",
    icon: "../../assets/icons/reporting.svg"
  }, {
    id: "/accounting",
    label: "Accounting",
    icon: "../../assets/icons/accounting.svg"
  }, {
    id: "/administration",
    label: "Admin",
    icon: "../../assets/icons/administration.svg"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "fms-shell",
    style: {
      display: "grid",
      gridTemplateColumns: "240px 1fr",
      gridTemplateRows: "56px 1fr",
      height: "100vh",
      background: "var(--gray-1)",
      fontFamily: "Quicksand, sans-serif"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      gridColumn: "1 / -1",
      background: "var(--blueberry-pie--500)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      padding: "0 var(--space-lg)",
      gap: "var(--space-lg)",
      boxShadow: "var(--shadow-sm)",
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-sm)",
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/fms-icon.svg",
    alt: "FMS",
    width: "32",
    height: "32",
    style: {
      filter: "brightness(0) invert(1)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "700 16px Quicksand",
      letterSpacing: ".04em"
    }
  }, "FMS")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 520,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Search leads, families, children, employees...",
    value: query,
    onChange: e => setQuery(e.target.value),
    onFocus: () => setSearchOpen(true),
    onBlur: () => setTimeout(() => setSearchOpen(false), 150),
    style: {
      width: "100%",
      background: "rgba(255,255,255,.12)",
      border: "1px solid rgba(255,255,255,.25)",
      color: "#fff",
      borderRadius: 30,
      padding: "8px 16px 8px 36px",
      outline: "none",
      font: "500 13px Quicksand"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 12,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#fff",
      opacity: .8
    }
  }, "\u2315"), searchOpen && query && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 40,
      left: 0,
      right: 0,
      background: "#fff",
      color: "var(--blueberry-pie--500)",
      borderRadius: 10,
      boxShadow: "var(--shadow-md)",
      padding: "var(--space-sm)",
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "700 11px Quicksand",
      textTransform: "uppercase",
      letterSpacing: ".06em",
      color: "var(--gray-5)",
      padding: "4px 8px"
    }
  }, "Suggestions"), ["Leads matching " + query, "Families matching " + query, "Children matching " + query].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "8px",
      borderRadius: 5,
      font: "600 13px Quicksand",
      cursor: "pointer"
    },
    onMouseOver: e => e.currentTarget.style.background = "var(--gray-1)",
    onMouseOut: e => e.currentTarget.style.background = "transparent"
  }, s)))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSchoolMenuOpen(v => !v),
    style: {
      background: "transparent",
      border: "1px solid rgba(255,255,255,.3)",
      color: "#fff",
      padding: "6px 14px",
      borderRadius: 30,
      font: "700 12px Quicksand",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, user.activeSchool.name), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .7
    }
  }, "\u25BE")), schoolMenuOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 0,
      top: 40,
      background: "#fff",
      color: "var(--blueberry-pie--500)",
      borderRadius: 10,
      boxShadow: "var(--shadow-md)",
      padding: 6,
      minWidth: 280,
      zIndex: 30
    }
  }, user.schools.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    onClick: () => {
      onSchoolChange?.(s);
      setSchoolMenuOpen(false);
    },
    style: {
      padding: "10px 12px",
      borderRadius: 5,
      font: "600 13px Quicksand",
      cursor: "pointer",
      background: s === user.activeSchool.name ? "var(--gray-1)" : "transparent"
    }
  }, s, s === user.activeSchool.name && /*#__PURE__*/React.createElement("span", {
    style: {
      float: "right"
    }
  }, "\u2713"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setUserMenuOpen(v => !v),
    style: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "var(--cotton-candy--500)",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      font: "700 13px Quicksand"
    }
  }, user.name.split(" ").map(n => n[0]).join("")), userMenuOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 0,
      top: 44,
      background: "#fff",
      color: "var(--blueberry-pie--500)",
      borderRadius: 10,
      boxShadow: "var(--shadow-md)",
      padding: 8,
      minWidth: 200,
      zIndex: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 10px",
      borderBottom: "1px solid var(--gray-2)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "700 13px Quicksand"
    }
  }, user.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "500 11px Quicksand",
      color: "var(--gray-5)"
    }
  }, user.role)), ["My Profile", "Preferences", "Help", "Log out"].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "8px 10px",
      borderRadius: 5,
      font: "600 13px Quicksand",
      cursor: "pointer"
    },
    onMouseOver: e => e.currentTarget.style.background = "var(--gray-1)",
    onMouseOut: e => e.currentTarget.style.background = "transparent"
  }, s))))), /*#__PURE__*/React.createElement("nav", {
    style: {
      background: "#fff",
      borderRight: "1px solid var(--gray-2)",
      padding: "var(--space-md) 0",
      overflow: "auto"
    }
  }, navItems.map(n => /*#__PURE__*/React.createElement("a", {
    key: n.id,
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 18px",
      font: "700 13px Quicksand",
      color: activePath === n.id ? "var(--blueberry-pie--500)" : "var(--gray-6)",
      background: activePath === n.id ? "var(--cotton-candy--50, #E8F2FB)" : "transparent",
      borderLeft: activePath === n.id ? "3px solid var(--blueberry-pie--500)" : "3px solid transparent",
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: n.icon,
    alt: "",
    width: "22",
    height: "22"
  }), /*#__PURE__*/React.createElement("span", null, n.label)))), /*#__PURE__*/React.createElement("main", {
    style: {
      overflow: "auto",
      padding: "var(--space-lg) var(--space-xl)"
    }
  }, children));
};
window.FMSShell = Shell;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/UpcomingEvents.jsx
try { (() => {
/* global React, FMSCard */
const UpcomingEvents = ({
  birthdays,
  separations,
  anniversaries
}) => {
  const Section = ({
    icon,
    title,
    items,
    render
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: "var(--space-sm)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: icon,
    alt: "",
    width: "22",
    height: "22"
  }), /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      font: "700 13px Quicksand",
      color: "var(--blueberry-pie--500)"
    }
  }, title)), items.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: "500 12px Quicksand",
      color: "var(--gray-5)"
    }
  }, "None upcoming") : /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: 0,
      padding: 0
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      font: "600 12px/1.5 Quicksand",
      color: "var(--blueberry-pie--500)",
      padding: "6px 0",
      borderTop: i ? "1px solid var(--gray-2)" : "none"
    }
  }, render(it)))));
  return /*#__PURE__*/React.createElement(FMSCard, {
    title: "Upcoming Events"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-lg)"
    }
  }, /*#__PURE__*/React.createElement(Section, {
    icon: "../../assets/illustrations/birthday.svg",
    title: "Birthdays",
    items: birthdays,
    render: b => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("b", null, b.name), " \xB7 ", b.date, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--gray-5)",
        fontWeight: 500
      }
    }, "(", b.age, ")"))
  }), /*#__PURE__*/React.createElement(Section, {
    icon: "../../assets/illustrations/transition.svg",
    title: "Separations",
    items: separations,
    render: s => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("b", null, s.name), " \xB7 ", s.date, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--gray-5)",
        fontWeight: 500
      }
    }, "(", s.classroom, ")"))
  }), /*#__PURE__*/React.createElement(Section, {
    icon: "../../assets/illustrations/badge.svg",
    title: "Work Anniversaries",
    items: anniversaries,
    render: a => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("b", null, a.name), " \xB7 ", a.years, " yrs ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--gray-5)",
        fontWeight: 500
      }
    }, "(", a.role, ")"))
  })));
};
window.FMSUpcomingEvents = UpcomingEvents;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/UpcomingEvents.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/data.js
try { (() => {
// Mock data mirrored from src/mocks/data shapes
window.FMS_DATA = {
  user: {
    name: "Sarah Mitchell",
    role: "School Director",
    activeSchool: {
      id: "0123",
      name: "The Goddard School of Bryn Mawr"
    },
    schools: ["The Goddard School of Bryn Mawr", "The Goddard School of Wayne", "The Goddard School of King of Prussia"]
  },
  leads: {
    newLeads: 3,
    toured: 12,
    updated: 4,
    registered: 5,
    noShow: 1
  },
  tours: {
    today: 2,
    nextFiveDays: 7,
    pastDue: 1
  },
  tasks: {
    today: 4,
    thisWeek: 11,
    pastDue: 2
  },
  birthdays: [{
    name: "Liam Andersen",
    date: "May 3",
    age: "turns 4"
  }, {
    name: "Maya Chen",
    date: "May 6",
    age: "turns 3"
  }, {
    name: "Jackson Pierre",
    date: "May 9",
    age: "turns 5"
  }],
  separations: [{
    name: "Olivia Reyes",
    date: "May 12",
    classroom: "Pre-K B"
  }],
  anniversaries: [{
    name: "Ms. Emma Foster",
    years: 5,
    role: "Teacher · Toddler 2"
  }, {
    name: "Mr. David Kim",
    years: 2,
    role: "Asst. Director"
  }],
  alerts: [{
    id: 1,
    unread: true,
    title: "New tour scheduled",
    body: "The Andersen family · Friday at 10:30am.",
    time: "2h ago"
  }, {
    id: 2,
    unread: true,
    title: "Document overdue",
    body: "Marcus Lee's medical form is past due.",
    time: "Yesterday"
  }, {
    id: 3,
    unread: false,
    title: "Enrollment confirmed",
    body: "Mia Patel — start date June 2.",
    time: "2d ago"
  }, {
    id: 4,
    unread: false,
    title: "Tuition statement ready",
    body: "May statements available for review.",
    time: "3d ago"
  }],
  quickLinks: [{
    label: "LEAD CENTER",
    color: "blueberry"
  }, {
    label: "FAMILY CENTER",
    color: "blueberry"
  }, {
    label: "iGODDARD",
    color: "blueberry"
  }, {
    label: "BRAND CONNECT",
    color: "blueberry"
  }, {
    label: "SCHOOL PERFORMANCE HUB",
    color: "blueberry"
  }, {
    label: "WONDER OF LEARNING HUB",
    color: "blueberry"
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/data.js", error: String((e && e.message) || e) }); }

})();
