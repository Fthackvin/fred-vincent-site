
  let parts = drupalSettings.path.currentPath.split("/");
  let nid = parts[parts.length - 1];
  const width = window.innerWidth;
  const staticWidth = window.innerWidth + 1000
  //const staticWidth = 4500
  const height = window.innerHeight;
  const hang = '/api/exhibition/' + nid + '/hang';
  const removeArtworkEndpoint = '/api/exhibition/' + nid + '/exhibit/';
  const url = '/api/exhibition/' + nid + '/get-hung-artworks?iuz';
  const collectionEndpoint = '/api/exhibition/' + nid + '/get-collection?iuz';
  const PADDING = 500;
  const darkgray = '#595959';
  const lightgray = '#999';
  const physicalWallHeight = 600 //300cm
  const floorHeight = height - physicalWallHeight
  const shadowOffset = 3;

  const gallery = new Vue({
    el: '#app4',
    delimiters: ["[[", "]]"],
    data: {
      exhibitionTitle: 'CBP Prize 2021',
      modalPrizeStatus:'',modalPrevDisabled:false,swiped:false,modalBio:'',modalDepth:null,modalInsta:'',modalNft:'',modalStatement:'',modalWebsite:'',tabIndex:0,windowWallWidth:9000,
      canvas: '#app-canvas',
      galleryHeight: height,
      stageSize: {
        //width: width * 3,
        width: staticWidth,
        height: height,
        id: 'test',
      },
      conversion: 2,
      conversionValues: {
        xSm: 1,
        sm: 1.5,
        md: 2,
        lg: 2.5,
        xLg: 3,
      },
      floor: {
        x: 0,
        y: physicalWallHeight,
        //y: height - floorHeight,
        //width: width * 5, //not sure why this is *5
        width: staticWidth * 2,
        //height: floorHeight,
        height: 2000,
        fillLinearGradientStartPoint: {x: -50, y: -50},
        fillLinearGradientEndPoint: {x: width * 5, y: 50},
        fillLinearGradientColorStops: [0, darkgray, 0.1, lightgray, 0.3, darkgray, 0.4, lightgray, 0.5, darkgray, 0.6, lightgray, 0.7, darkgray, 0.8, lightgray, 1, darkgray],
        opacity: 0.5,
      },
      options: {
        responsive: [
          {end: 576, size: 2},
          {start: 576, end: 768, size: 4},
          {start: 768, end: 992, size: 6},
          {size: 8},
        ],
        list: {
          // 1200 because @media (min-width: 1200px) and therefore I want to switch to windowed mode
          windowed: 1200,
          // Because: #app {padding: 80px 24px;}
          padding: 24,
        },
        position: {
          start: 0,
        },
        autoplay: {play: false, repeat: true, speed: 2500},
      },
      collection: [],
      exhibits: {},
      order: [],
      itemUrl: '',
      itemId: '',
      itemWidthCm: '',
      itemHeightCm: '',
      currentShape: '',
      modalTitle: '',
      modalArtist: '',
      modalImgSrc: '',
      modalCaption: '',
      modalDate: '',
      modalMedia: '',
      modalSize: '',
      modalDesc: '',
      modalFormat: '',
      modalLandscape: false,
      classLandscape: {
        'offset-1': true,
        'col-md-10': true
      },
      classPortrait: {
        'offset-2': true,
        'col-md-8': true
      },
      modalNextDisabled: false,
      modalPrevDisabledCShow: false,
      collectionShow: false,
      currentShown: false,
      currentIndex: 0,
      showCollection: false,
      showBody: false,
    },
    beforeDestroy: function () {
      //window.removeEventListener('resize', this.handleConversion(true))
    },
    mounted() {
      let test = 1
      //let newStageHeight = this.$refs.container.offsetHeight - this.$refs.header.offsetHeight
      //let newStageHeight = this.$refs.container.offsetHeight - this.$refs.header.offsetHeight
      let newStageHeight = Math.max(880, Math.round(window.innerHeight * 1.1))
      Vue.set(this.stageSize,'height',newStageHeight)
      this.setConversion(newStageHeight)
      window.addEventListener('resize', this.handleResize)
      this.upDate();
      this.getExhibits();
      this.$el.style.backgroundColor = 'background: linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(0,212,255,1) 100%)';
      window.addEventListener('click', () => {
        this.$refs.imageMenu.style.display = 'none'
      });
      const scrollContainer = document.getElementById('app-canvas');
      scrollContainer.addEventListener('scroll', () => {
        scrollContainer.classList.add("transformed");
        this.$refs.imageMenu.style.display = 'none'
        this.repositionStage(scrollContainer);
      });
    },
    methods: {
      selectDetailTab: function(index, focus) {
        this.tabIndex = index;
        if (focus) this.$nextTick(function() { var button=document.getElementById('detail-tab-'+index); if(button)button.focus(); });
      },
      isMobile: mixinDetictingMobile.methods.isMobile,
      swipeHandler: function(dir) { this.moveModal(dir === 'left' ? 'next' : 'prev'); },
/*      beforeEnterBody: function (el) {
        el.style.display = 'none'
        el.style.opacity = 0
        el.style.transform = 'translateY(-10%)'
        console.log('before')
      },
      enterBody: function (el, done) {
        el.style.display = 'block'
        //Velocity(el, { opacity: 1,translateY: 0 }, { duration: 3000 })
        Velocity(el, { transform: 'translateY(0)',opacity: 1 }, { duration: 3000 })
        console.log('enter')
      },
      leaveBody: function (el, done) {
        Velocity(el, { translateX: '15px', rotateZ: '50deg' }, { duration: 6000 })
        Velocity(el, { rotateZ: '100deg' }, { loop: 2 })
        Velocity(el, {
          rotateZ: '45deg',
          translateY: '30px',
          translateX: '30px',
          opacity: 0
        }, { complete: done })
        console.log('left')
      },*/
      setConversion(val) {
        if (val < 450) { this.conversion = 'xSm' } else
        if (val < 675) { this.conversion = 'sm' } else
        if (val < 900) { this.conversion = 'md' } else
        if (val < 1125) { this.conversion = 'lg' } else
        if (val >= 1125) { this.conversion = 'xLg' } else
        {this.conversion = 'md'}
      },
      handleResize: function () {
        console.log('resizing away')
        let newStageHeight = Math.max(880, Math.round(window.innerHeight * 1.1))
        Vue.set(gallery.stageSize,'height',newStageHeight)
        this.setConversion(newStageHeight)
        this.handleConversion()
      },
      handleConversion() {
        let rate = gallery.conversionValues[gallery.conversion]
        Vue.set(this.stageSize,'width',window.innerWidth + 1000)
        this.windowWallWidth = Math.ceil(window.COHORT_CBP.wallWidthCm * rate)
        Vue.set(this.floor,'width',this.windowWallWidth)
        Vue.set(this.floor,'y',220*rate)
        document.getElementById('large-container').style.backgroundPosition = '0px ' + (220*rate) + 'px'
        Object.keys(gallery.exhibits).forEach(key => {
          Vue.set(gallery.exhibits[key],'x',gallery.exhibits[key]['xPhysical']*rate);
          Vue.set(gallery.exhibits[key],'y',gallery.exhibits[key]['yPhysical']*rate);
          Vue.set(gallery.exhibits[key],'width',gallery.exhibits[key]['physicalWidth']*rate);
          Vue.set(gallery.exhibits[key],'height',gallery.exhibits[key]['physicalHeight']*rate);
          Vue.set(gallery.exhibits[key],'shadowOffsetY',shadowOffset*rate);
        })
      },
      toggleShowCollection() {
        this.showCollection = !this.showCollection;
      },
      openDetailModal: function (e) {
        e.evt.preventDefault();
        let currentId = e.target.id()
        let key = gallery.getIdPosition(currentId)
        gallery.populateModal(currentId, key)
        gallery.$bvModal.show('artwork-modal')
      },
      prevModal: function (e) {
        gallery.moveModal('prev')
      },
      nextModal: function (e) {
        gallery.moveModal('next')
      },
      moveModal: function (dir) {
        let index = gallery.currentShown
        let key = gallery.getAdjacentKey(index, dir)
        if (key || key === 0) {
          let id = gallery.order[key][0]
          gallery.populateModal(id, key)
        }
      },
      setModalNavigation: function (key) {
        let next = gallery.getAdjacentKey(key, 'next')
        if (next || next === 0) {
          gallery.modalNextDisabled = false
        }
        else {
          gallery.modalNextDisabled = true
        }
        let prev = gallery.getAdjacentKey(key, 'prev')
        if (prev || prev === 0) {
          gallery.modalPrevDisabled = false
        }
        else {
          gallery.modalPrevDisabled = true
        }
      },
      populateModal: function (id, key) {
        id = gallery.getIdPositionCollection(id)
        gallery.modalTitle = gallery.collection[id].name;
        gallery.modalImgSrc = gallery.collection[id].imagefile;
        gallery.modalDate = gallery.collection[id].date
        gallery.modalMedia = gallery.collection[id].media
        let cmHeight = parseFloat(gallery.collection[id].heightCm)
        let cmwidth = parseFloat(gallery.collection[id].widthCm)
        gallery.modalFormat = (cmwidth > cmHeight) ? 'landscape' : 'portrait';
        if (cmwidth > cmHeight) {
          gallery.modalLandscape = true
        }
        else {
          gallery.modalLandscape = false
        }
        gallery.modalSize = '<span class="num">' + cmHeight + '</span> × <span class="num">' + cmwidth + '</span> <span class="text-lowercase">cm</span>'
        gallery.modalArtist = gallery.collection[id].artist
        gallery.modalDesc = gallery.collection[id].description
        gallery.setModalNavigation(key)
        gallery.currentShown = key
        let caption = []
        if (gallery.modalTitle) {
          caption.push(gallery.modalTitle)
        }
        if (gallery.modalDate) {
          caption.push(gallery.modalDate)
        }
        if (gallery.modalMedia) {
          caption.push(gallery.modalMedia)
        }
        if (gallery.modalSize) {
          caption.push(gallery.modalSize)
        }
        gallery.modalCaption = caption.join(', ');
      },
      getIdPosition: function (id) {
        for (let key in gallery.order) {
          if (gallery.order[key][0] == id)
            return key
        }
        return false
      },
      getIdPositionCollection: function (id) {
        for (let key in gallery.collection) {
          if (gallery.collection[key]['id'] == id)
            return key
        }
        return false
      },
      getAdjacentKey: function (key, dir) {
        if (dir == 'next')
          key++
        if (dir == 'prev') {
          key--
        }
        if (typeof gallery.order[key] === 'undefined') {
          return false
        }
        return key
      },
      repositionStage: function repositionStage(scrollContainer) {
        let dx = scrollContainer.scrollLeft - PADDING;
        const stage = gallery.$refs.layer.getStage()
        const container = document.getElementById('container');
        container.style.transform = 'translate(' + dx + 'px)';
        stage.x(-dx);
        stage.batchDraw();
      },
      contextMenu: function (e) {
        // prevent default behavior
        e.evt.preventDefault();
        if (e.target.getType() === 'stage') {
          return;
        }
        gallery.currentShape = e.target
        // show menu
        gallery.$refs.imageMenu.style.display = 'initial';
        gallery.$refs.imageMenu.style.zIndex = 999;
        //let containerRect = gallery.container().getBoundingClientRect();
        let containerRect = gallery.$el.getBoundingClientRect()
        let stage = e.target.getStage();
        let scrollDiv = document.getElementById('app-canvas').childNodes[0]
        let xoffset = scrollDiv.scrollLeft
        gallery.$refs.imageMenu.style.top = containerRect.top + stage.getPointerPosition().y + 4 + 'px';
        const scrollContainer = document.getElementById('app-canvas');
        if (scrollContainer.classList.contains('transformed')) {
          gallery.$refs.imageMenu.style.left = containerRect.left + stage.getPointerPosition().x - xoffset - PADDING + 'px';
        }
        else {
          gallery.$refs.imageMenu.style.left = containerRect.left + stage.getPointerPosition().x - xoffset + 'px';
        }
      },
      getExhibits: function () {
        // fetch data from a url endpoint
        //axios.get("/some_url_endpoint");
        axios.get(url).then(response => {
          const attrs = response.data
          let order = [];
          Object.keys(attrs).forEach(key => {
            let image = new window.Image();
            image.id = key
            //image.draggable = attrs[key]['draggable']
            image.onload = () => {
              attrs[key]['image'] = image;
            }
            image.src = attrs[key]['src'];
            let img = new Image();
            img.onload = function () {
            }
            img.src = attrs[key]['src'];
            img.id = key
            attrs[key]['image'] = img;
            attrs[key]['shadowOpacity'] = .3
            attrs[key]['preventDefault'] = false
            order.push([key, Number(attrs[key]['xPhysical']) + Number(attrs[key]['yPhysical']) / 10000])
            gallery.exhibits = attrs
          })
          gallery.handleConversion(false)
          //console.info(posData)
          order.sort((a, b) => a[1] - b[1]);
          gallery.order = order
        }).catch(console.log);
      },
      upDate: function () {
        let array = []
        axios.get(collectionEndpoint).then((response) => {
          Object.keys(response.data).forEach((property) => {
            array.push(response.data[property])
          });
          this.collection = array
        })
      },
      resortExhibits(attrs) {
        console.info(attrs)
        let key = gallery.getIdPosition(attrs['id'])
        let pos = attrs['x'] + attrs['y'] / 10
        let order = gallery.order
        if (key) {
          Vue.set(gallery.order[key], 1, pos);
        }
        else {
          order.push([attrs['id'], pos])
        }
        gallery.order = order.sort((a, b) => a[1] - b[1]);
      },
      handleMouseMove() {
        let ypos = gallery.$refs.stage.getNode().getPointerPosition().y;
        if (ypos < 70) {
          gallery.showCollection = true
        } else if (ypos > 70) {
          gallery.showCollection = false
        }
      },
      handleMouseMoveHeader(e) {
        let yOffset = e.target.getBoundingClientRect().y
        let height = e.target.getBoundingClientRect().height
        let ypos = e.clientY
        let activeArea = 40
        if (e.target.id == 'exhibition-header') {
          if (ypos > height + yOffset - activeArea) {
            gallery.showCollection = true
          } else if (ypos < height + yOffset - activeArea) {
            gallery.showCollection = false
          }
        }
/*        console.log('id ' + e.target.id)
        console.log('height ' + height)
        console.log('offset ' + yOffset)*/



      },
      handleDragEnd(e) {
        const attrs = e.target.attrs;
        let rate = gallery.conversionValues[gallery.conversion]
        attrs['xPhysical'] = attrs['x'] / rate;
        attrs['yPhysical'] = attrs['y'] / rate;
        this.hangExhibit(attrs)
        gallery.resortExhibits(attrs)
      },
      hangExhibit(attrs) {
        this.loggedEvent = 'handleDragEnd';
        const formData = new FormData();
        Object.keys(attrs).forEach(key => {
          formData.append(key, attrs[key]);
        });
        axios.post(hang, formData, {
          retry: 3,
          retryDelay: 100,
        })
          .then(res => {
            console.log('get results', res.data);
          })
          .catch(console.log);
      },
      removeArtwork(id) {
        axios.post(removeArtworkEndpoint + id + '/remove', id, {
          retry: 3,
          retryDelay: 100,
        })
          .then(res => {
            console.log(id + ' deleted');
          })
          .catch(console.log);
      },
      handleDragOver(e) {
        console.log('drag over123');
        e.preventDefault(); // !important
      },
      handleDragLeave(e) {
        console.log('leaving over123');
        e.preventDefault(); // !important
      },
      handleDrop(e) {
        console.log('dropped')
        e.preventDefault(); // !important
        let rect = e.target.getBoundingClientRect()
        //let cmUnitInPx = Math.round(rect.height/300)
        //let cmUnitInPx = Math.round(gallery.stageSize.height / physicalWallHeight)
        const scrollContainer = document.getElementById('app-canvas');
        let xpos = e.clientX - rect.left - gallery.itemWidthCm / 2;
        if (scrollContainer.classList.contains('transformed')) {
          let dx = scrollContainer.scrollLeft - PADDING;
          xpos = xpos + dx;
        }
        let ypos = e.clientY - rect.top - gallery.itemHeightCm / 2;  //y position within the element.
        let obj = {};
        let rate = gallery.conversionValues[gallery.conversion]
        const imageObj = new window.Image();
        imageObj.onload = () => {
          imageObj.id = gallery.itemId;
          obj['image'] = imageObj;
          obj['src'] = gallery.itemUrl;
          obj['xPhysical'] = xpos / rate;
          obj['yPhysical'] = ypos / rate;
          obj['x'] = xpos;
          obj['y'] = ypos;
          obj['id'] = gallery.itemId;
          obj['physicalWidth'] = gallery.itemWidthCm;
          obj['physicalHeight'] = gallery.itemHeightCm;
          obj['conversion'] = gallery.conversion;
          obj['width'] = gallery.itemWidthCm * rate;
          obj['height'] = gallery.itemHeightCm * rate;
          obj['draggable'] = "true";
          obj['shadowColor'] = "black";
          obj['shadowBlur'] = 4;
          obj['shadowOffsetX'] = 0;
          obj['shadowOffsetY'] = shadowOffset * rate;
          obj['shadowOpacity'] = 0.3;
          Vue.set(gallery.exhibits, gallery.itemId, obj);
          let index = gallery.getIdPositionCollection(gallery.itemId)
          Vue.set(gallery.collection[index], 'draggable', "false");
          gallery.resortExhibits(obj)
          this.hangExhibit(obj)
        };
        imageObj.src = gallery.itemUrl;
        gallery.$refs.layer.getStage().draw();
        console.log('does it get here?')
      },
/*      handleDragLeave(e) {
        console.log('drag leave');
        e.preventDefault(); // !important
      },*/
      handleDragStart(e) {
        gallery.itemUrl = e.target.src;
        gallery.itemWidthCm = e.target.getAttribute('data-width-cm');
        gallery.itemHeightCm = e.target.getAttribute('data-height-cm');
        console.log('drag target')
        console.log(e.target.id)
        gallery.itemId = e.target.id
        console.log('drag start ' + gallery.itemUrl)
      },
      onDragging() {
        console.log('dragging')
      },
      deleteNode(e) {
        console.info(e)
        let id = gallery.currentShape.getId()
        let key = gallery.getIdPosition(id)
        gallery.order.splice(key, 1);
        gallery.$delete(gallery.exhibits, id)
        let index = gallery.getIdPositionCollection(id)
        Vue.set(gallery.collection[index], 'draggable', "true");
        const formData = new FormData();
        Object.keys(gallery.exhibits).forEach(key => {
          formData.append(key, gallery.exhibits[key]);
          console.log('item ' + key)
        });
        console.info(formData)
        gallery.removeArtwork(id)
      },
      editNode(e) {
        console.info(e)
        let id = gallery.currentShape.getId()
        id = id.split('-').pop()
        console.log('media id = ' + id)
        window.location.href = '/media/' + id + '/edit?destination=' + window.location.pathname;
      },
      highest(data) {
        var tupleArray = [];
        for (var key in data) tupleArray.push([key, data[key]]);
        tupleArray.sort(function (a, b) {
          return a[1] - b[1]
        });
        return tupleArray;
      }
    },
  });

//window.addEventListener('resize', gallery.refreshStageSize());
