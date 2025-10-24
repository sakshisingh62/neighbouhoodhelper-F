import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, AlertCircle, MapPin, Loader } from 'lucide-react';
import api from '../utils/api';

const EditPostPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      type: 'help',
      category: 'general',
      urgency: 'low',
    },
  });

  const postType = watch('type');

  // Fetch existing post data
  const { data: post, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const response = await api.get(`/posts/${id}`);
      return response.data;
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        description: post.description,
        type: post.type,
        category: post.category,
        urgency: post.urgency || 'low',
        location: post.location?.area || '',
        tags: post.tags?.join(', ') || '',
      });

      // If post has coordinates, set current location
      if (post.location?.coordinates) {
        setCurrentLocation({
          latitude: post.location.coordinates.lat,
          longitude: post.location.coordinates.lng,
        });
      }
    }
  }, [post, reset]);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setValue('location', address);
          toast.success('Location fetched successfully!');
        } catch (error) {
          setValue('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          toast.success('Coordinates captured!');
        }
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = 'Unable to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Convert tags string to array
      const tags = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      // Prepare location data with coordinates if available
      const locationData = currentLocation
        ? {
            area: data.location || 'Current Location',
            coordinates: {
              lat: currentLocation.latitude,
              lng: currentLocation.longitude,
            },
          }
        : data.location;

      const postData = {
        ...data,
        tags,
        location: locationData,
      };

      await api.put(`/posts/${id}`, postData);
      toast.success('Post updated successfully!');
      navigate(`/posts/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update post');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingPost) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Post not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit Post
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Update your post details
        </p>
      </div>

      {/* Form Card */}
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Post Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Post Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary-500">
                <input
                  type="radio"
                  value="help"
                  {...register('type', { required: true })}
                  className="sr-only"
                />
                <div className="text-center">
                  <AlertCircle
                    size={32}
                    className={`mx-auto mb-2 ${
                      postType === 'help'
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      postType === 'help'
                        ? 'text-primary-600'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Request Help
                  </span>
                </div>
                {postType === 'help' && (
                  <div className="absolute inset-0 border-2 border-primary-600 rounded-lg pointer-events-none"></div>
                )}
              </label>

              <label className="relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary-500">
                <input
                  type="radio"
                  value="offer"
                  {...register('type', { required: true })}
                  className="sr-only"
                />
                <div className="text-center">
                  <Save
                    size={32}
                    className={`mx-auto mb-2 ${
                      postType === 'offer'
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      postType === 'offer'
                        ? 'text-primary-600'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Offer Help
                  </span>
                </div>
                {postType === 'offer' && (
                  <div className="absolute inset-0 border-2 border-primary-600 rounded-lg pointer-events-none"></div>
                )}
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', {
                required: 'Title is required',
                minLength: {
                  value: 5,
                  message: 'Title must be at least 5 characters',
                },
                maxLength: {
                  value: 100,
                  message: 'Title must be less than 100 characters',
                },
              })}
              className="input"
              placeholder="e.g., Need help moving furniture"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description', {
                required: 'Description is required',
                minLength: {
                  value: 20,
                  message: 'Description must be at least 20 characters',
                },
              })}
              rows={6}
              className="input resize-none"
              placeholder="Provide more details..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Category & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select {...register('category', { required: true })} className="input">
                <option value="general">General</option>
                <option value="moving">Moving & Transport</option>
                <option value="repairs">Repairs & Maintenance</option>
                <option value="shopping">Shopping & Errands</option>
                <option value="tutoring">Tutoring & Learning</option>
                <option value="technology">Technology Help</option>
                <option value="gardening">Gardening & Plants</option>
                <option value="pets">Pet Care</option>
                <option value="food">Food & Cooking</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Urgency
              </label>
              <select {...register('urgency')} className="input">
                <option value="low">Low - Can wait</option>
                <option value="medium">Medium - This week</option>
                <option value="high">High - ASAP</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                {...register('location')}
                className="input flex-1"
                placeholder="e.g., Building A, Room 205"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="btn btn-outline flex items-center gap-2 whitespace-nowrap"
                title="Get current location"
              >
                {isGettingLocation ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Getting...
                  </>
                ) : (
                  <>
                    <MapPin size={18} />
                    Update
                  </>
                )}
              </button>
            </div>
            {currentLocation && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <MapPin size={14} />
                Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              {...register('tags')}
              className="input"
              placeholder="e.g., furniture, heavy lifting, weekend"
            />
            <p className="mt-1 text-sm text-gray-500">
              Separate tags with commas
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Update Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostPage;
