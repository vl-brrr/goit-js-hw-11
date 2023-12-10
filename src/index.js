import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import axios from 'axios';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

const form = document.querySelector('.search-form');
const gallery = document.querySelector('.gallery');
const loader = document.querySelector('.load-block');
const end = document.querySelector('.load-end');
loader.classList.add('hidden');
end.classList.add('hidden');
let page = 1;

const options = {
  root: null,
  rootMargin: '300px',
  threshold: 0,
};

const observer = new IntersectionObserver(handleScroll, options);

const lightbox = new SimpleLightbox('.gallery a');

form.addEventListener('submit', handleSearch);

async function handleSearch(event) {
  event.preventDefault();
  const { searchQuery } = event.currentTarget.elements;

  if (!loader.classList.contains('hidden')) {
    loader.classList.add('hidden');
  }
  if (!end.classList.contains('hidden')) {
    end.classList.add('hidden');
  }

  if (gallery.innerHTML) {
    gallery.innerHTML = '';
  }

  try {
    page = 1;
    if (searchQuery.value.trim() === '') {
      throw 'Not valid';
    }
    const data = await getSearch(searchQuery.value.trim(), page);
    if (data.hits.length === 0) {
      throw 'No images';
    }
    Notify.success(`Hooray! We found ${data.totalHits} images.`);
    gallery.insertAdjacentHTML('beforeend', createMarkUp(data.hits));
    loader.classList.remove('hidden');
    observer.observe(loader);
    lightbox.refresh();
  } catch (err) {
    if (err === 'No images') {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
    } else if (err === 'Not valid') {
      Notify.failure('Please enter a proper query');
    } else {
      Notify.failure(err.message);
    }
  } finally {
    form.reset();
  }
}

async function getSearch(search, pageNumber) {
  const BASE_URL = 'https://pixabay.com/api/';

  const result = await axios.get(BASE_URL, {
    params: {
      key: '41167713-557a540e7bc9705ead8f70719',
      q: search,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: true,
      page: pageNumber,
      per_page: 40,
    },
  });
  return result.data;
}

function handleScroll(entries, observer) {
  entries.forEach(async entry => {
    if (entry.isIntersecting) {
      page += 1;
      const { searchQuery } = form.elements;
      try {
        const data = await getSearch(searchQuery.value, page);
        gallery.insertAdjacentHTML('beforeend', createMarkUp(data.hits));
        lightbox.refresh();

        if (page >= Math.ceil(data.totalHits / 40)) {
          observer.unobserve(entry.target);
          end.classList.remove('hidden');
        }
      } catch (err) {
        Notify.failure(err.message);
      }
    }
  });
}

function createMarkUp(arr) {
  return arr
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `
    <div class="photo-card">
        <a href="${largeImageURL}"><img class="photo" src="${webformatURL}" alt="${tags}" loading="lazy" /></a>
        <div class="info">
            <p class="info-item">
            <b>Likes</b><br />
            ${likes}
            </p>
            <p class="info-item">
            <b>Views</b><br />
            ${views}
            </p>
            <p class="info-item">
            <b>Comments</b><br />
            ${comments}
            </p>
            <p class="info-item">
            <b>Downloads</b><br />
            ${downloads}
            </p>
        </div>
    </div>`
    )
    .join('');
}
