
export default function ModalManager(cfg) {
  const ob = {
    el: cfg.el,
    store: cfg.store,
    currentModal: null,
    modals: cfg.modals || {}
  }

  const modal = ob.el.querySelector('.modal');

  ob.showModal = function(id) {
    const t = document.getElementById(id);
    if (!t) {
      console.warn(`No modal template with ID ${id}`);
      return;
    }

    const content = document.importNode(t.content, true);
    modal.innerHTML = '';
    modal.appendChild(content);

    // Instantiate registered controller for the modal, if any
    if (ob.modals[id]) {
      const View = ob.modals[id];
      ob.currentView = View({
        el: modal,
        store: cfg.store,
      });
    }

    document.body.scrollTop = 0;
    document.body.style.overflow = 'hidden';

    ob.el.classList.add('show');

    ob.currentModal = id;
    ob.store.update({currentModal: ob.currentModal});
  }

  ob.hideModal = function() {
    document.body.style.overflow = '';

    ob.el.classList.remove('show');
    ob.currentModal = null;
    modal.innerHTML = '';
    ob.store.update({currentModal: null});
  }

  ob.el.addEventListener('click', function(e) {
    if (e.target === this) {
      ob.hideModal();
    }
  });

  document.body.addEventListener('keydown', function(e) {
    if (ob.currentModal && e.keyCode == 27)
      ob.hideModal();
  });

  document.body.addEventListener('click', function(e) {
    const id = e.target.dataset.modalId;
    if (!id) return;

    ob.showModal(id);
  });

  return ob;
}

